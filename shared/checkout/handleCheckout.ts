// (keep the top imports and interface as is)

// ... (keep the hashCartMeta and other functions)

export async function handleCheckout({ req, res }:{ req: NextApiRequest; res: NextApiResponse; }) {
  console.log('[handleCheckout] Invoked');
  console.log('[handleCheckout] body:', JSON.stringify(req.body, null, 2));
  try {

  // (keep the origin check and CORS as is)

  // (keep the method check)

  const payload = req.body as CheckoutPayload;
  if (!payload.store_id) {
    warn('Missing store_id');
    res.status(400).json({ error: 'Missing store_id' });
    return;
  }

  log('Incoming checkout payload:', JSON.stringify(payload, null, 2));

  if (debug) {
    log('[debug] Raw payment_method:', payload.payment_method);
  }

  const {
    payment_method,
    payment_token,
    email,
    first_name,
    last_name,
    billing,
    billing_first_name,
    billing_last_name,
    shipping,
    cart,
    total,
    currency,
    store_id,
    platform,
    description
  } = payload;

  console.log('[handleCheckout] Checking required fields:');
  console.log('email:', email ? 'present' : 'missing');
  console.log('first_name:', first_name ? 'present' : 'missing');
  console.log('last_name:', last_name ? 'present' : 'missing');
  console.log('shipping:', shipping ? 'present' : 'missing');
  console.log('cart:', cart ? 'present' : 'missing');
  console.log('total:', typeof total === 'number' ? 'present' : 'missing');
  console.log('currency:', currency ? 'present' : 'missing');
  console.log('store_id:', store_id ? 'present' : 'missing');

  if (!email || !first_name || !last_name || !shipping || !cart || typeof total !== 'number' || !currency || !store_id) {
    warn('Missing required fields');
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  log('[debug] Raw payment_method:', payment_method);

  if (!Array.isArray(cart) || cart.length === 0) {
    warn('Empty cart');
    res.status(400).json({ error: 'Cart cannot be empty' });
    return;
  }

  if (total <= 0) {
    warn('Invalid total:', total);
    res.status(400).json({ error: 'Invalid total' });
    return;
  }

  const { name, address } = shipping;
  const { line1, line2, city, state, postal_code, country } = address || {};
  console.log('[handleCheckout] Shipping details check:');
  console.log('shipping.name:', name ? 'present' : 'missing');
  console.log('address.line1:', line1 ? 'present' : 'missing');
  console.log('address.city:', city ? 'present' : 'missing');
  console.log('address.postal_code:', postal_code ? 'present' : 'missing');
  console.log('address.state:', state ? 'present' : 'missing');
  console.log('address.country:', country ? 'present' : 'missing');

  if (!name || !line1 || !city || !postal_code || !state || !country) {
    warn('Invalid shipping details');
    res.status(400).json({ error: 'Invalid shipping details' });
    return;
  }

  const { data: storeSettings, error: settingsError } = await supabase
    .from('store_settings')
    .select('settings')
    .eq('store_id', store_id)
    .maybeSingle();

  if (settingsError) {
    err('Store settings lookup failed:', settingsError.message);
    res.status(500).json({ error: 'Failed to load store settings' });
    return;
  }

  const provider = storeSettings?.settings?.active_payment_gateway as string;
  log('Selected provider:', provider);

  const providers: Record<string, any> = {
    stripe: stripeProvider,
    authorizeNet: authorizeNetProvider,
    paypal: paypalProvider,
    nmi: nmiProvider,
    segpay: segpayProvider
  };
  const providerHandler = providers[provider];
  if (!providerHandler) {
    warn('Unknown provider:', provider);
    res.status(400).json({ error: 'Unsupported payment provider' });
    return;
  }

  if (provider === 'authorizeNet' && !payment_method?.dataValue) {
    err('Missing opaque token from Accept.js');
    return res.status(400).json({ error: 'Missing opaque token from Accept.js' });
  }

  if (provider === 'authorizeNet' && !payload.order_number) {
    warn('Missing order_number for Authorize.Net checkout');
    return res.status(400).json({ error: 'order_number is required' });
  }

  if (provider === 'nmi' && !payment_token) {
    warn('Missing payment_token for NMI checkout');
    return res.status(400).json({ error: 'payment_token is required' });
  }

  log('[debug] Passed payment_method checks');

  let cart_meta_hash;
  if (provider !== 'authorizeNet') {
    try {
      cart_meta_hash = hashCartMeta(email, total, cart);
      if (!cart_meta_hash) {
        warn('cart_meta_hash is missing — using fallback');
        cart_meta_hash = crypto
          .createHash('sha256')
          .update(JSON.stringify(cart))
          .digest('hex');
      }
    } catch (err) {
      err('[error] Failed to compute cart_meta_hash:', err);
      return res.status(500).json({ error: 'cart_meta_hash failed' });
    }

    const { data: existingOrders, error: lookupErr } = await supabase
      .from('orders')
      .select('id, created_at, status')
      .eq('store_id', store_id)
      .eq('customer_email', email)
      .eq('total_price', total)
      .eq('cart_meta_hash', cart_meta_hash)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lookupErr) {
      err('Order deduplication check failed:', lookupErr.message);
      res.status(500).json({ error: 'Order lookup failed' });
      return;
    }

    const dedupWindowMs = 5 * 60 * 1000; // five minutes
    if (existingOrders && existingOrders.length > 0) {
      const existing = existingOrders[0];
      const ageMs = Date.now() - new Date(existing.created_at as string).getTime();
      if (existing.status !== 'paid' && ageMs < dedupWindowMs) {
        warn('Duplicate order detected within window', { order_id: existing.id });
        res.status(409).json({ error: 'Duplicate order detected. Please wait for payment to complete.' });
        return;
      }
    }
  }

  const metaCart = cart.map((item: any) => ({ id: item.product_id, qty: item.quantity }));
  const metaCartString = JSON.stringify(metaCart).slice(0, 500);

  const providerPayloadSummary = {
    payment_method,
    payment_token,
    total,
    currency,
    store_id,
    cart_items: cart.length
  };
  log("Provider payload summary:", providerPayloadSummary);

  let providerResult;
  try {
    providerResult = await providerHandler({
      payment_method,
      payment_token,
      email,
      first_name,
      last_name,
      shipping: {
        name,
        address: { line1, line2: line2 || undefined, city, state, postal_code, country }
      },
      billing,
      billing_first_name,
      billing_last_name,
      cart,
      total,
      ...(provider === 'nmi' ? { amount: total } : {}),
      currency,
      description,
      metaCartString,
      store_id
    });
  } catch (e: any) {
    err('Provider handler error:', e?.message || e);
    res.status(500).json({ error: 'Failed to process payment' });
    return;
  }

  if (providerResult && providerResult.success === false) {
    warn('Provider handler returned error:', providerResult.error);
    res.status(400).json({ error: providerResult.error });
    return;
  }

  const intent = providerResult?.intent ?? providerResult;
  let transactionId: string | null = null;
  let paymentIntentId: string | null = null;

  if (provider === 'authorizeNet') {
    const transId = providerResult?.data?.transactionResponse?.transId;
    transactionId = transId || null;
    paymentIntentId = transId || null;
  } else if (provider === 'nmi') {
    const transId =
      providerResult?.transaction_id ??
      (typeof providerResult?.data?.get === 'function'
        ? providerResult.data.get('transactionid')
        : undefined);
    transactionId = transId || null;
    paymentIntentId = transId || null;
  } else {
    transactionId = intent?.id || null;
    paymentIntentId = transactionId;
  }

  let customerId: string | null = null;
  try {
    customerId = await findOrCreateCustomer(supabase, store_id, email);
  } catch (error: any) {
    err('findOrCreateCustomer failed:', error?.message || error);
    res.status(500).json({ error: 'Failed to record customer' });
    return;
  }

  if (provider === 'authorizeNet') {
    const orderNumber = payload.order_number!;
    const { data: existingOrder, error: lookupError } = await supabase
      .from('orders')
      .select('id, raw_data, platform')
      .eq('store_id', store_id)
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (lookupError) {
      err('Order lookup failed:', lookupError.message);
      res.status(500).json({ error: 'Order lookup failed' });
      return;
    }

    if (!existingOrder) {
      warn('Order not found for store:', orderNumber, store_id);
      res.status(404).json({ error: 'Order not found for store' });
      return;
    }

    const updatePayload = {
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_intent_id: paymentIntentId,
      customer_id: customerId,
      platform: payload.platform || existingOrder.platform || null,
      raw_data: {
        ...(existingOrder.raw_data || {}),
        transaction_id: transactionId,
        transactionResponse: providerResult?.data?.transactionResponse
      }
    };

    if (provider === 'authorizeNet') {
      const transId = providerResult?.data?.transactionResponse?.transId;
      if (transId === '0') {
        console.warn(
          '[handleCheckout] \u26A0\uFE0F Received sandbox transId "0" \u2014 skipping insert'
        );
      }
      updatePayload.payment_intent_id = transId && transId !== '0' ? transId : null;
    }

    console.log('[handleCheckout] updatePayload:', updatePayload);

    let updated;
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('store_id', store_id)
        .eq('order_number', orderNumber)
        .select('id')
        .single();
      if (error) {
        err('Failed to update order:', error.message);
        return res.status(500).json({ error: 'Order update failed' });
      }
      updated = data;
    } catch (e: any) {
      err('Supabase update threw:', e);
      err('Update payload:', updatePayload);
      console.error(e);
      return res.status(500).json({ error: 'Order update failed' });
    }

    if (!updated) {
      warn('Order not updated:', orderNumber);
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      order_id: updated?.id,
      order_number: orderNumber,
      payment_intent_id: paymentIntentId
    });
  }

  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('prefix, order_sequence')
    .eq('id', store_id)
    .maybeSingle();

  if (storeError) {
    err('Store lookup failed:', storeError.message);
    res.status(500).json({ error: 'Failed to fetch store information' });
    return;
  }

  if (!storeData) {
    warn('Invalid store_id provided');
    res.status(400).json({ error: 'Invalid store_id' });
    return;
  }

  const { prefix, order_sequence } = storeData as any;
  if (!prefix || order_sequence === null || order_sequence === undefined) {
    err('Store configuration invalid');
    res.status(500).json({ error: 'Store configuration invalid' });
    return;
  }

  const nextSequence = Number(order_sequence) + 1;
  let orderNumber: string | undefined;
  try {
    orderNumber = await generateOrderNumber?.(store_id);
  } catch (e) {
    err('[generateOrderNumber] Failed to generate order number:', e);
  }
  orderNumber =
    orderNumber ?? `${prefix}-${String(nextSequence).padStart(4, '0')}`;

  log('[debug] Preparing orderPayload. Total:', total, 'Currency:', currency, 'Cart length:', cart.length);

  let orderPayload;
  try {
    const providerIntent = providerResult?.intent ?? providerResult;
    const paymentConfirmed =
      (provider === 'authorizeNet' && providerResult?.success !== false) ||
      (provider === 'stripe' && providerIntent?.status === 'succeeded') ||
      (provider === 'nmi' && providerResult?.success === true);

    orderPayload = {
      order_number: orderNumber,
      status: paymentConfirmed ? 'paid' : 'unpaid',
      ...(paymentConfirmed ? { paid_at: new Date().toISOString() } : {}),
      payment_provider: provider,
      raw_data:
        provider === 'authorizeNet'
          ? { ...req.body, transaction_id: transactionId }
          : provider === 'nmi' && providerResult?.success
            ? {
                ...req.body,
                transaction_id: transactionId,
                transactionResponse: providerResult.data
              }
            : req.body,
      cart_meta_hash,
      total_price: total,
      store_id,
      platform: platform || 'webflow',
      customer_id: customerId,
      customer_email: email,
      payment_intent_id: paymentIntentId
    };
    console.log('[handleCheckout] orderPayload before upsert:', orderPayload);
  } catch (err) {
    err('[error] Failed to build orderPayload:', err);
    return res.status(500).json({ error: 'Failed to build orderPayload' });
  }

  log('[debug] Final orderPayload:', orderPayload);

  let orderData;
  try {
    const { data, error } = await supabase
      .from('orders')
      .upsert(orderPayload, { onConflict: 'order_number' })
      .select('id')
      .single();
    if (error) {
      console.error('[handleCheckout] Supabase upsert error:', error);
      return res.status(500).json({ error: 'Order insert failed' });
    }
    orderData = data;
  } catch (e) {
    console.error('[handleCheckout] Supabase upsert threw:', e);
    return res.status(500).json({ error: 'Order insert failed' });
  }

  log('createOrder result:', JSON.stringify({ data: orderData }, null, 2));

  if (orderData) {
    const itemRows = cart.map((item: any) => ({
      order_id: orderData.id,
      sku: item.product_id || item.sku || '',
      product_name: item.name || item.product_name || '',
      quantity: item.quantity,
      unit_price: item.price || item.unit_price
    }));

    if (itemRows.length) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemRows);
      if (itemsError) {
        err('Failed to insert order items:', itemsError.message);
        return res.status(500).json({ error: 'Failed to insert order items' });
      }
    }
  }



  log('Order creation result:', orderData);

  res.status(200).json({
    success: true,
    order_id: orderData?.id,
    order_number: orderNumber,
    payment_intent_id: paymentIntentId
  });
  } catch (e: any) {
    err(e);
    return res.status(400).json({ error: e.message });
  }
}