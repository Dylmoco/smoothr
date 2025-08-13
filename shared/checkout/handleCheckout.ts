import type { NextApiRequest, NextApiResponse } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, testMarker } from '../supabase/serverClient';
import { findOrCreateCustomer } from '../lib/findOrCreateCustomer';
import crypto from 'crypto';
import { validateCheckoutPayload } from './utils/validateCheckoutPayload';
import { dedupeOrders } from './utils/dedupeOrders';

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

async function validateDiscountCode(
  client: SupabaseClient,
  storeId: string,
  customerId: string | null,
  code: string,
  total?: number
) {
  const { data: disc, error } = await client
    .from('discounts')
    .select('*')
    .eq('store_id', storeId)
    .eq('code', code)
    .maybeSingle();
  if (error || !disc) return { valid: false };

  const now = Date.now();
  const active = disc.active !== false;
  const startsOk = !disc.starts_at || new Date(disc.starts_at).getTime() <= now;
  const endsOk = !disc.expires_at || new Date(disc.expires_at).getTime() >= now;
  const minOk =
    !disc.min_order_value_cents ||
    (typeof total === 'number' && total >= disc.min_order_value_cents);
  if (!active || !startsOk || !endsOk || !minOk) return { valid: false };

  if (disc.max_redemptions) {
    const { count: totalUses, error: usesErr } = await client
      .from('discount_usages')
      .select('id', { head: true, count: 'exact' })
      .eq('discount_id', disc.id);
    if (usesErr) return { valid: false };
    if (typeof totalUses === 'number' && totalUses >= disc.max_redemptions) {
      return { valid: false };
    }
  }

  if (customerId && disc.limit_per_customer) {
    const { count: custCount, error: custErr } = await client
      .from('discount_usages')
      .select('id', { head: true, count: 'exact' })
      .eq('discount_id', disc.id)
      .eq('customer_id', customerId);
    if (custErr) return { valid: false };
    if (typeof custCount === 'number' && custCount >= disc.limit_per_customer) {
      return { valid: false };
    }
  }

  const summary = {
    type: disc.type,
    value_cents: disc.type === 'percent' ? undefined : disc.amount,
    percent: disc.type === 'percent' ? disc.amount : undefined,
  };

  return { valid: true, record: disc, summary };
}

export async function handleCheckout({ req, res }: { req: NextApiRequest; res: NextApiResponse; }) {
  log('[handleCheckout] Invoked');
  log('[handleCheckout] body:', JSON.stringify(req.body, null, 2));
  log('[handleCheckout] testMarker:', testMarker);
  log('[DEBUG] SERVICE ROLE LOADED?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  log('[DEBUG] SUPABASE_URL:', process.env.SUPABASE_URL);
  try {

  const origin = req.headers.origin as string | undefined;
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(400).end();
    return;
  }

  const payload = req.body as CheckoutPayload;
  const { store_id } = payload;

  log('[STEP] Fetching store by ID...');
  const { data: storeMatch, error: storeErr } = await supabase
    .from('stores')
    .select('id')
    .eq('id', store_id);
  
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

  if (!store_id) {
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
    description,
    discount_code,
    discount_id,
    customer_id,
    same_billing  // Use the flag
  } = payload;
  let total = payload.total;

  if (discount_code && !payment_method) {
    const { valid, summary } = await validateDiscountCode(
      supabase,
      store_id,
      customer_id ?? null,
      discount_code,
      total
    );
    res.status(200).json({ valid, discount: summary });
    return;
  }

  const validationError = validateCheckoutPayload(payload);
  if (validationError) {
    warn(validationError.error);
    res.status(400).json(validationError);
    return;
  }

  log('[debug] Raw payment_method:', payment_method);
  let customerId: string | null = null;
  try {
    log('[STEP] Fetching customer...');
    customerId = await findOrCreateCustomer(supabase, store_id, email);
  } catch (error: any) {
    err('findOrCreateCustomer failed:', error?.message || error);
    res.status(500).json({ error: 'Failed to record customer' });
    return;
  }

  let customer_profile_id: string | null = null;


  const { name, address } = shipping;
  const { line1, line2, city, state, postal_code, country } = address || {};

  // validation handled by validateCheckoutPayload

  let discountRecord: any = null;
  let discountSummary: any = null;
  if (discount_code) {
    const result = await validateDiscountCode(
      supabase,
      store_id,
      customerId,
      discount_code,
      total
    );
    if (result.valid && result.record) {
      discountRecord = result.record;
      discountSummary = result.summary;
      const amt =
        discountRecord.type === 'percent'
          ? Math.round(total * (discountRecord.amount / 100))
          : discountRecord.amount;
      log('Applying discount', discountRecord, amt);
      total = Math.max(0, total - amt);
    }
  }

  log('[STEP] Fetching store_settings...');
  const { data: storeSettings, error: settingsError } = await supabase
    .from('store_settings')
    .select('settings')
    .eq('store_id', store_id)
    .maybeSingle();

  if (settingsError) {
    console.error('[Supabase ERROR] Store settings lookup failed:', settingsError.message);
    res
      .status(500)
      .json({ error: 'Failed to load store settings', detail: settingsError.message });
    return;
  }

  const provider = (storeSettings?.settings?.active_payment_gateway || '') as string;
  log('Selected provider:', provider);

  // Fetch customer payment profile using the selected provider
  log('[STEP] Fetching customer_payment_profiles...');
  const { data: profileRows, error: profileErr } = await supabase
    .from('customer_payment_profiles')
    .select('profile_id')
    .eq('customer_id', customerId)
    .eq('gateway', provider)
    .limit(1);

  if (profileErr) {
    console.error('[Supabase ERROR] Profile lookup failed:', profileErr.message);
    return res
      .status(500)
      .json({ error: 'Profile lookup failed', detail: profileErr.message });
  }

  customer_profile_id = profileRows?.[0]?.profile_id || null;

  let providerHandler: any;
  try {
    const providerFile = provider === 'stripe' ? 'stripeProvider' : provider;
    const mod = await import(`./providers/${providerFile}.ts`);
    providerHandler = mod.default;
  } catch (e) {
    warn('Unknown provider:', provider);
    res.status(400).json({ error: 'Unsupported payment gateway' });
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

    log('[STEP] Checking for duplicate orders...');
    let existing: any = null;
    try {
      existing = await dedupeOrders(supabase, {
        store_id,
        customer_id: customerId,
        total,
        cart_meta_hash
      });
    } catch (e: any) {
      console.error('[Supabase ERROR] Order deduplication check failed:', e.message);
      res.status(500).json({ error: 'Order lookup failed', detail: e.message });
      return;
    }

    if (existing && existing.status !== 'paid' && existing.payment_intent_id) {
      warn('Duplicate order in progress', { order_id: existing.id });
      res.status(409).json({
        error: 'Order processing in progress',
        order_id: existing.id,
        user_message: 'This order is currently being processed. Please wait a moment before trying again.'
      });
      return;
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
    log('[handleCheckout] Provider result:', JSON.stringify(providerResult, null, 2));
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
    warn('[handleCheckout] Provider handler returned error:', providerResult.error || 'No error message');

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
    log('[STEP] Upserting customer_payment_profiles...');
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

  let transactionId: string | null = null;
  let paymentIntentId: string | null = null;

  if (provider === 'authorizeNet') {
    const transId = providerResult?.data?.transactionResponse?.transId;
    transactionId = transId || null;
    paymentIntentId = transId || null;
  } else {
    transactionId = providerResult.transaction_id || null;
    paymentIntentId = transactionId;
  }


  if (provider === 'authorizeNet') {
    const orderNumber = payload.order_number!;
    log('[STEP] Checking existing order for Authorize.Net...');
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
        warn(
          '[handleCheckout] \u26A0\uFE0F Received sandbox transId "0" \u2014 skipping insert'
        );
      }
      updatePayload.payment_intent_id = transId && transId !== '0' ? transId : null;
    }

    log('[handleCheckout] updatePayload:', updatePayload);

    let updated;
    try {
      log('[STEP] Updating order (Authorize.Net)...');
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
      log('[STEP] Inserting order_items (Authorize.Net)...');
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
      log('[STEP] Logging discount usage (Authorize.Net)...');
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

  log('[STEP] Fetching stores...');
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

  let orderNumber: string | undefined;
  try {
    orderNumber = await generateOrderNumber?.(store_id);
  } catch (e) {
    err('[generateOrderNumber] Failed to generate order number:', e.message || e);
  }
  if (!orderNumber) {
    const { data: generatedNumber, error: orderNumErr } = await supabase.rpc(
      'next_order_number',
      { store_id },
    );
    if (orderNumErr || !generatedNumber) {
      return res.status(500).json({
        error: 'Failed to generate order number',
        detail: orderNumErr?.message,
      });
    }
    orderNumber = generatedNumber as string;
  }

  log('[debug] Preparing orderPayload. Total:', total, 'Currency:', currency, 'Cart length:', cart.length);

  let orderPayload;
  try {
    const paymentConfirmed =
      (provider === 'authorizeNet' && providerResult?.success !== false) ||
      providerResult?.success === true;

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
    log('[handleCheckout] orderPayload before upsert:', orderPayload);
  } catch (error) {
    err('[error] Failed to build orderPayload:', error.message || error);
    return res.status(500).json({ error: 'Failed to build orderPayload' });
  }

  log('[debug] Final orderPayload:', orderPayload);

  let orderData;
  try {
    log('[STEP] Upserting order record...');
    const { data, error } = await supabase
      .from('orders')
      // Ensure upsert uses the composite unique constraint on (store_id, order_number)
      .upsert(orderPayload, { onConflict: 'store_id,order_number' })
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
      log('[STEP] Inserting order_items...');
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
      log('[STEP] Logging discount usage...');
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
    discount_applied: !!discountRecord,
    discount_summary: discountSummary,
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