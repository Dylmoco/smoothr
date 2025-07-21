import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, testMarker } from '../supabase/serverClient.ts';
console.log('[handleCheckout] testMarker:', testMarker);
import { findOrCreateCustomer } from '@/lib/findOrCreateCustomer';
import crypto from 'crypto';
import stripeProvider from './providers/stripe';
import authorizeNetProvider from './providers/authorizeNet';
import paypalProvider from './providers/paypal';
import nmiProvider from './providers/nmi';
import segpayProvider from './providers/segpay';

interface CheckoutPayload {
  order_number?: string;
  payment_method: any;
  payment_token?: string;
  email: string;
  first_name: string;
  last_name: string;
  shipping: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  billing?: {
    name?: string;
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  billing_first_name?: string;
  billing_last_name?: string;
  cart: any[];
  total: number;
  currency: string;
  description?: string;
  discount_code?: string;
  discount_id?: string;
  customer_id?: string | null;
  store_id: string;
  platform?: string;
  same_billing?: boolean;  // Added for checkbox flag
}
// Optional global to allow custom order number generation
const generateOrderNumber =
  (globalThis as any).generateOrderNumber as
    | ((storeId: string) => string | Promise<string>)
    | undefined;

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Smoothr Checkout]', ...args);
const warn = (...args: any[]) => debug && console.warn('[Smoothr Checkout]', ...args);
const err = (...args: any[]) => debug && console.error('[Smoothr Checkout]', ...args);

function hashCartMeta(email: string, total: number, cart: any[]): string {
  const normalized = cart
    .map(i => ({ id: i.product_id || i.name || '', qty: i.quantity }))
    .sort((a, b) => (a.id ?? '').toString().localeCompare((b.id ?? '').toString()));
  const input = `${email}-${total}-${JSON.stringify(normalized)}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function handleCheckout({ req, res }: { req: NextApiRequest; res: NextApiResponse; }) {
  console.log('[handleCheckout] Invoked');
  console.log('[handleCheckout] body:', JSON.stringify(req.body, null, 2));
  console.log('[DEBUG] SERVICE ROLE LOADED?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('[DEBUG] SUPABASE_URL:', process.env.SUPABASE_URL);
  try {

  const origin = req.headers.origin as string | undefined;
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(400).end();
    return;
  }

  const { data: storeMatch, error: storeErr } = await supabase
    .from('stores')
    .select('id')
    .or(`store_domain.eq.${origin},live_domain.eq.${origin}`);
  if (storeErr) {
    console.error('[Supabase ERROR] Store lookup failed:', storeErr.message);
    res
      .status(500)
      .json({ error: 'Store lookup failed', detail: storeErr.message });
    return;
  }

  if (!storeMatch || storeMatch.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(403).end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    warn('Method not allowed:', req.method);
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const payload = req.body as CheckoutPayload;
  if (!payload.store_id) {
    warn('Missing store_id');
    res.status(400).json({ 
      error: 'Missing store_id',
      field: 'store_id',
      user_message: 'Configuration error. Please refresh the page and try again.'
    });
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
    currency,
    store_id,
    description,
    discount_code,
    discount_id,
    same_billing  // Use the flag
  } = payload;
  let total = payload.total;

  const missingFields = [] as any[];
  if (!email) missingFields.push({ field: 'email', message: 'Email is required' });
  if (!first_name) missingFields.push({ field: 'first_name', message: 'First name is required' });
  if (!last_name) missingFields.push({ field: 'last_name', message: 'Last name is required' });
  if (!shipping) missingFields.push({ field: 'shipping', message: 'Shipping information is required' });
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    missingFields.push({ field: 'cart', message: 'Cart cannot be empty' });
  }
  if (typeof total !== 'number' || total <= 0) {
    missingFields.push({ field: 'total', message: 'Invalid order total' });
  }
  if (!currency) missingFields.push({ field: 'currency', message: 'Currency is required' });
  if (!store_id) missingFields.push({ field: 'store_id', message: 'Store ID is required' });

  if (missingFields.length > 0) {
    warn('Missing required fields:', missingFields);
    res.status(400).json({
      error: 'Missing required fields',
      missing_fields: missingFields,
      user_message: 'Please fill in all required fields and try again.'
    });
    return;
  }

  log('[debug] Raw payment_method:', payment_method);


  let customerId: string | null = null;
  try {
    customerId = await findOrCreateCustomer(supabase, store_id, email);
  } catch (error: any) {
    err('findOrCreateCustomer failed:', error?.message || error);
    res.status(500).json({ error: 'Failed to record customer' });
    return;
  }

  let customer_profile_id: string | null = null;
  const { data: profileData, error: profileErr } = await supabase
    .from('customer_payment_profiles')
    .select('profile_id')
    .eq('customer_id', customerId)
    .eq('gateway', 'nmi')
    .single();
  if (profileErr) {
    console.error('[Supabase ERROR] Profile lookup failed:', profileErr.message);
    return res
      .status(500)
      .json({ error: 'Profile lookup failed', detail: profileErr.message });
  }
  customer_profile_id = profileData?.profile_id || null;


  const { name, address } = shipping;
  const { line1, line2, city, state, postal_code, country } = address || {};

  const shippingErrors = [] as any[];
  if (!name) shippingErrors.push({ field: 'shipping_name', message: 'Recipient name is required' });
  if (!line1) shippingErrors.push({ field: 'ship_line1', message: 'Street address is required' });
  if (!city) shippingErrors.push({ field: 'ship_city', message: 'City is required' });
  if (!postal_code) shippingErrors.push({ field: 'ship_postal', message: 'Postal code is required' });
  if (!state) shippingErrors.push({ field: 'ship_state', message: 'State is required' });
  if (!country) shippingErrors.push({ field: 'ship_country', message: 'Country is required' });

  if (shippingErrors.length > 0) {
    warn('Invalid shipping details:', shippingErrors);
    res.status(400).json({ 
      error: 'Invalid shipping details',
      shipping_errors: shippingErrors,
      user_message: 'Please check your shipping information and try again.'
    });
    return;
  }

  // Billing validation
  if (!same_billing) {
    const billingErrors = [];
    const billAddr: any = billing?.address || {};  // Use any to bypass TS
    if (!billAddr.line1) billingErrors.push({ field: 'bill_line1', message: 'Billing street required' });
    if (!billAddr.city) billingErrors.push({ field: 'bill_city', message: 'Billing city required' });
    if (!billAddr.state) billingErrors.push({ field: 'bill_state', message: 'Billing state required' });
    if (!billAddr.postal_code) billingErrors.push({ field: 'bill_postal', message: 'Billing postal required' });
    if (!billAddr.country) billingErrors.push({ field: 'bill_country', message: 'Billing country required' });

    if (billingErrors.length > 0) {
      warn('Invalid billing details:', billingErrors);
      res.status(400).json({ 
        error: 'Invalid billing details',
        billing_errors: billingErrors,
        user_message: 'Please check your billing information and try again.'
      });
      return;
    }
  }

  let discountRecord: any = null;
  if (discount_id || discount_code) {
    const { data: disc, error: discErr } = await supabase
      .from('discounts')
      .select('*')
      .eq(discount_id ? 'id' : 'code', discount_id || discount_code)
      .maybeSingle();
    if (discErr) {
      console.error('[Supabase ERROR] Discount lookup failed:', discErr.message);
      return res
        .status(500)
        .json({ error: 'Discount lookup failed', detail: discErr.message });
    }
    if (!disc) {
      warn('Discount lookup failed:', discErr?.message);
    } else {
      const now = Date.now();
      const active = disc.active !== false;
      const startsOk = !disc.starts_at || new Date(disc.starts_at).getTime() <= now;
      const endsOk = !disc.expires_at || new Date(disc.expires_at).getTime() >= now;
      if (active && startsOk && endsOk) {
        const { count: totalUses, error: usesErr } = await supabase
          .from('discount_usages')
          .select('id', { head: true, count: 'exact' })
          .eq('discount_id', disc.id);
        if (usesErr) {
          console.error('[Supabase ERROR] Discount usage count failed:', usesErr.message);
          return res
            .status(500)
            .json({ error: 'Discount usage lookup failed', detail: usesErr.message });
        }
        if (
          disc.max_redemptions &&
          typeof totalUses === 'number' &&
          totalUses >= disc.max_redemptions
        ) {
          warn('Discount max redemptions reached');
        } else {
          let perCustomerOk = true;
          if (customerId && disc.limit_per_customer) {
            const { count: custCount, error: custErr } = await supabase
              .from('discount_usages')
              .select('id', { head: true, count: 'exact' })
              .eq('discount_id', disc.id)
              .eq('customer_id', customerId);
            if (custErr) {
              console.error('[Supabase ERROR] Discount usage lookup failed:', custErr.message);
              return res
                .status(500)
                .json({ error: 'Discount usage lookup failed', detail: custErr.message });
            }
            if (
              typeof custCount === 'number' &&
              custCount >= disc.limit_per_customer
            ) {
              perCustomerOk = false;
            }
          }
          if (perCustomerOk) discountRecord = disc;
        }
      }
    }
  }

  if (discountRecord) {
    const amt =
      discountRecord.type === 'percent'
        ? Math.round(total * (discountRecord.amount / 100))
        : discountRecord.amount;
    log('Applying discount', discountRecord, amt);
    total = Math.max(0, total - amt);
  }

  const { data: storeSettings, error: settingsError } = await supabase
    .from('public_store_settings')
    .select('active_payment_gateway')
    .eq('store_id', store_id)
    .maybeSingle();

  if (settingsError) {
    console.error('[Supabase ERROR] Store settings lookup failed:', settingsError.message);
    res
      .status(500)
      .json({ error: 'Failed to load store settings', detail: settingsError.message });
    return;
  }

  const provider = (storeSettings?.active_payment_gateway || '') as string;
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

  if (provider === 'nmi' && !payment_token && !customer_profile_id) {
    warn('Missing payment_token or customer_profile_id for NMI checkout');
    return res.status(400).json({ error: 'payment_token or customer_profile_id is required' });
  }

  log('[debug] Passed payment_method checks');

  let cart_meta_hash;
  if (provider !== 'authorizeNet') {
    try {
      cart_meta_hash = hashCartMeta(email, total, cart);
    } catch (error) {
      err('[error] Failed to compute cart_meta_hash:', error.message || error);
      return res.status(500).json({ 
        error: 'cart_meta_hash failed',
        user_message: 'Processing error. Please try again.'
      });
    }
  
    const { data: existingOrders, error: lookupErr } = await supabase
      .from('orders')
      .select('id, created_at, status, payment_intent_id')
      .eq('store_id', store_id)
      .eq('customer_id', customerId)
      .eq('total_price', total)
      .eq('cart_meta_hash', cart_meta_hash)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lookupErr) {
      console.error(
        '[Supabase ERROR] Order deduplication check failed:',
        lookupErr.message
      );
      res
        .status(500)
        .json({ error: 'Order lookup failed', detail: lookupErr.message });
      return;
    }
  
    if (existingOrders && existingOrders.length > 0) {
      const existing = existingOrders[0];
      const ageMs = Date.now() - new Date(existing.created_at as string).getTime();
      const dedupWindowMs = Number(process.env.DEDUPE_WINDOW_MS) || 30 * 1000;
      console.log('[handleCheckout] Duplicate check: ageMs=', ageMs, 'status=', existing.status, 'payment_intent_id=', existing.payment_intent_id, 'dedupWindowMs=', dedupWindowMs);
      if (existing.status === 'paid') {
        // No block for completed payments, allow new order
      } else if (existing.payment_intent_id) {
        warn('Duplicate order in progress', { order_id: existing.id });
        res.status(409).json({ 
          error: 'Order processing in progress',
          order_id: existing.id,
          user_message: 'This order is currently being processed. Please wait a moment before trying again.'
        });
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
      customer_profile_id,
      email,
      first_name,
      last_name,
      shipping: {
        name,
        address: { line1, line2: line2 || undefined, city, state, postal_code, country }
      },
      billing: billing || {
        name: `${first_name} ${last_name}`.trim(),
        address: {
          line1,
          line2: line2 || undefined,
          city,
          state,
          postal_code,
          country
        }
      },
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
    console.log('[handleCheckout] Provider result:', JSON.stringify(providerResult, null, 2));
  } catch (e: any) {
    console.error('[handleCheckout] Provider handler error:', e?.message || e);
    let userMessage = 'Payment processing failed. Please try again.';
    if (e?.message?.includes('card')) {
      userMessage = 'Payment method error. Please check your card details and try again.';
    } else if (e?.message?.includes('declined')) {
      userMessage = 'Your payment was declined. Please try a different payment method.';
    } else if (e?.message?.includes('insufficient')) {
      userMessage = 'Insufficient funds. Please try a different payment method.';
    } else if (e?.message?.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    }

    res.status(500).json({ 
      error: 'Failed to process payment', 
      details: e?.message || 'Unknown error',
      user_message: userMessage
    });
    return;
  }

  if (providerResult && providerResult.success === false) {
    console.warn('[handleCheckout] Provider handler returned error:', providerResult.error || 'No error message');

    let userMessage = 'Payment failed. Please try again.';
    const errorMsg = providerResult.error || '';

    if (errorMsg.includes('card')) {
      userMessage = 'Payment method error. Please check your card details.';
    } else if (errorMsg.includes('declined')) {
      userMessage = 'Your payment was declined. Please try a different payment method.';
    } else if (errorMsg.includes('insufficient')) {
      userMessage = 'Insufficient funds. Please try a different payment method.';
    }

    res.status(400).json({ 
      error: providerResult.error || 'Payment failed', 
      details: providerResult,
      user_message: userMessage
    });
    return;
  }

  if (provider === 'nmi' && providerResult.success && !customer_profile_id && providerResult.customer_vault_id) {
    const { error: vaultErr } = await supabase
      .from('customer_payment_profiles')
      .upsert(
        {
          customer_id: customerId,
          gateway: 'nmi',
          profile_id: providerResult.customer_vault_id
        },
        { onConflict: 'customer_id, gateway' }
      );
    if (vaultErr) {
      console.error('[Supabase ERROR] Customer profile upsert failed:', vaultErr.message);
      return res
        .status(500)
        .json({ error: 'Customer profile upsert failed', detail: vaultErr.message });
    }
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


  if (provider === 'authorizeNet') {
    const orderNumber = payload.order_number!;
    const { data: existingOrder, error: lookupError } = await supabase
      .from('orders')
      .select('id')
      .eq('store_id', store_id)
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (lookupError) {
      console.error('[Supabase ERROR] Order lookup failed:', lookupError.message);
      res
        .status(500)
        .json({ error: 'Order lookup failed', detail: lookupError.message });
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
      ...(discountRecord ? { discount_id: discountRecord.id } : {}),
    } as any;

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
        console.error('[Supabase ERROR] Failed to update order:', error.message);
        return res
          .status(500)
          .json({ error: 'Order update failed', detail: error.message });
      }
      updated = data;
    } catch (e: any) {
      err('Supabase update threw:', e.message || e);
      err('Update payload:', updatePayload);
      console.error(e);
      return res.status(500).json({ error: 'Order update failed' });
    }

    if (!updated) {
      warn('Order not updated:', orderNumber);
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemRows = cart.map((item: any) => ({
      order_id: updated.id,
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
        console.error('[Supabase ERROR] Failed to insert order items:', itemsError.message);
        return res
          .status(500)
          .json({ error: 'Failed to insert order items', detail: itemsError.message });
      }
    }

    if (discountRecord) {
      const { error: usageErr } = await supabase
        .from('discount_usages')
        .insert({
          order_id: updated.id,
          customer_id: customerId,
          discount_id: discountRecord.id,
          used_at: new Date().toISOString()
        });
      if (usageErr) {
        console.error('[Supabase ERROR] Failed to log discount usage:', usageErr.message);
        return res
          .status(500)
          .json({ error: 'Failed to log discount usage', detail: usageErr.message });
      }
    }

    return res.status(200).json({
      success: true,
      order_id: updated?.id,
      order_number: orderNumber,
      payment_intent_id: paymentIntentId,
      user_message: 'Order submitted successfully!'
    });
  }

  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('prefix, order_sequence')
    .eq('id', store_id)
    .maybeSingle();

  if (storeError) {
    console.error('[Supabase ERROR] Store lookup failed:', storeError.message);
    res
      .status(500)
      .json({ error: 'Failed to fetch store information', detail: storeError.message });
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
    err('[generateOrderNumber] Failed to generate order number:', e.message || e);
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
      cart_meta_hash,
      total_price: total,
      store_id,
      customer_id: customerId,
      ...(discountRecord ? { discount_id: discountRecord.id } : {}),
      payment_intent_id: paymentIntentId,
    };
    console.log('[handleCheckout] orderPayload before upsert:', orderPayload);
  } catch (error) {
    err('[error] Failed to build orderPayload:', error.message || error);
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
      console.error('[Supabase ERROR] Order insert failed:', error.message);
      return res
        .status(500)
        .json({ error: 'Order insert failed', detail: error.message });
    }
    orderData = data;
  } catch (e) {
    console.error('[Supabase ERROR] Supabase upsert threw:', e.message || e);
    return res
      .status(500)
      .json({ error: 'Order insert failed', detail: e.message || String(e) });
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
        console.error('[Supabase ERROR] Failed to insert order items:', itemsError.message);
        return res
          .status(500)
          .json({ error: 'Failed to insert order items', detail: itemsError.message });
      }
    }

    if (discountRecord) {
      const { error: usageErr } = await supabase
        .from('discount_usages')
        .insert({
          order_id: orderData.id,
          customer_id: customerId,
          discount_id: discountRecord.id,
          used_at: new Date().toISOString()
        });
      if (usageErr) {
        console.error('[Supabase ERROR] Failed to log discount usage:', usageErr.message);
        return res
          .status(500)
          .json({ error: 'Failed to log discount usage', detail: usageErr.message });
      }
    }
  }



  log('Order creation result:', orderData);

  res.status(200).json({
    success: true,
    order_id: orderData?.id,
    order_number: orderNumber,
    payment_intent_id: paymentIntentId,
    user_message: 'Order submitted successfully!'
  });
  } catch (e: any) {
    console.error('[handleCheckout] Global error:', e.message || e);
    let userMessage = 'An error occurred. Please try again.';
    if (e?.message?.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (e?.message?.includes('database')) {
      userMessage = 'Database error. Please try again in a moment.';
    }

    return res.status(500).json({ 
      error: e.message || 'Unknown error', 
      details: e,
      user_message: userMessage
    });
  }
}