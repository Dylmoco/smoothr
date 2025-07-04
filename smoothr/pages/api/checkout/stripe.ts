import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import supabase from '../../../../shared/supabase/serverClient';
import { findOrCreateCustomer } from '@/lib/findOrCreateCustomer';
import crypto from 'crypto';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Smoothr Checkout]', ...args);
const warn = (...args: any[]) => debug && console.warn('[Smoothr Checkout]', ...args);
const err = (...args: any[]) => debug && console.error('[Smoothr Checkout]', ...args);

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface ShippingInfo {
  name: string;
  address: ShippingAddress;
}

interface CheckoutPayload {
  payment_method: string;
  email: string;
  first_name: string;
  last_name: string;
  shipping: ShippingInfo;
  cart: any[];
  total: number;
  currency: string;
  store_id: string;
  platform?: string;
  description?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
  const origin = req.headers.origin as string | undefined;
  if (!origin) {
    console.log('[Smoothr Checkout API] Applying inline CORS headers (fallback)');
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(400).end();
    return;
  }

  const { data: storeMatch } = await supabase
    .from('stores')
    .select('id')
    .or(`store_domain.eq.${origin},live_domain.eq.${origin}`);

  if (!storeMatch || storeMatch.length === 0) {
    console.log('[Smoothr Checkout API] Applying inline CORS headers (fallback)');
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(403).end();
    return;
  }

  console.log('[Smoothr Checkout API] Applying inline CORS headers (fallback)');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[Smoothr Checkout API] Applying inline CORS headers (fallback)');
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  log('Incoming payload:', req.body);
  if (!req.body.email) warn('Missing email');
  if (!req.body.payment_method) warn('Missing payment_method');
  if (!Array.isArray(req.body.cart) || req.body.cart.length === 0)
    warn('Invalid or empty cart');
  if (!req.body.total || req.body.total <= 0)
    warn('Missing or invalid total');
  if (!req.body.currency) warn('Missing currency');

  if (req.method !== 'POST') {
    console.log('[Smoothr Checkout API] Applying inline CORS headers (fallback)');
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    warn('HTTP method not allowed:', req.method);
    console.log('[Smoothr Checkout] Method not allowed', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('[Smoothr Checkout] Incoming payload:', JSON.stringify(req.body, null, 2));

  try {
    const {
      payment_method,
      email,
      first_name,
      last_name,
      shipping,
      cart,
      total,
      currency,
      store_id,
      platform,
      description
    } = req.body as CheckoutPayload;

    if (
      !payment_method ||
      !email ||
      !first_name ||
      !last_name ||
      !shipping ||
      !cart ||
      typeof total !== 'number' ||
      !currency ||
      !store_id
    ) {
      warn('Rejecting request: missing required fields');
      console.log('[Smoothr Checkout] Missing required fields', req.body);
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      warn('Rejecting request: empty cart');
      console.log('[Smoothr Checkout] Empty cart received', cart);
      res.status(400).json({ error: 'Cart cannot be empty' });
      return;
    }

    if (total <= 0) {
      warn('Rejecting request: invalid total');
      console.log('[Smoothr Checkout] Invalid total value', total);
      res.status(400).json({ error: 'Invalid total' });
      return;
    }

    const { name, address } = shipping;
    const { line1, line2, city, state, postal_code, country } = address || {};
    if (!name || !line1 || !city || !postal_code || !state || !country) {
      warn('Rejecting request: invalid shipping details');
      console.log('[Smoothr Checkout] Invalid shipping details', shipping);
      res.status(400).json({ error: 'Invalid shipping details' });
      return;
    }

    const metaCart = cart.map((item: any) => ({
      id: item.product_id,
      qty: item.quantity
    }));
    const metaCartString = JSON.stringify(metaCart).slice(0, 500);

    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${email}-${total}-${JSON.stringify(metaCart)}`)
      .digest('hex');

    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency,
      payment_method,
      confirm: true,
      ...(description ? { description } : {}),
      metadata: {
        email,
        first_name,
        last_name,
        cart: metaCartString
      },
      shipping: {
        name,
        address: {
          line1,
          line2: line2 || undefined,
          city,
          state,
          postal_code,
          country
        }
      }
    }, { idempotencyKey });

    let customerId: string | null = null;
    try {
      customerId = await findOrCreateCustomer(supabase, store_id, email);
    } catch (error: any) {
      err('findOrCreateCustomer failed:', error?.message || error);
      console.log('[Smoothr Checkout] findOrCreateCustomer error', error);
      res.status(500).json({ error: 'Failed to record customer' });
      return;
    }

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('prefix, order_sequence')
      .eq('id', store_id)
      .maybeSingle();

    if (storeError) {
      err('Store lookup failed:', (storeError as any).message);
      console.log('[Smoothr Checkout] Store lookup error', storeError);
      res.status(500).json({ error: 'Failed to fetch store information' });
      return;
    }

    if (!storeData) {
      console.log('[Smoothr Checkout] storeData missing for id', store_id);
      warn('Invalid store_id provided');
      res.status(400).json({ error: 'Invalid store_id' });
      return;
    }

    const { prefix, order_sequence } = storeData as any;

    if (!prefix) {
      err('Store prefix missing');
      console.log('[Smoothr Checkout] Missing prefix for store', store_id);
      res.status(500).json({ error: 'Store configuration invalid' });
      return;
    }

    if (order_sequence === null || order_sequence === undefined) {
      err('order_sequence missing for store');
      console.log('[Smoothr Checkout] order_sequence missing', store_id);
      res.status(500).json({ error: 'Store configuration invalid' });
      return;
    }

    const nextSequence = Number(order_sequence) + 1;
    const orderNumber = `${prefix}-${String(nextSequence).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        status: 'processing',
        payment_provider: 'stripe',
        raw_data: req.body,
        items: cart,
        total_price: total,
        store_id,
        platform: platform || 'webflow',
        customer_id: customerId,
        customer_email: email,
        payment_intent_id: intent.id
      })
      .select('id')
      .single();

    if (error) {
      const insertErrorMessage = (error as any).message;
      err('Order insert failed:', insertErrorMessage);
      console.log('[Smoothr Checkout] Order insert error', error);
      res.status(400).json({ error: 'Order creation failed' });
      return;
    }

    const { error: updateError } = await supabase
      .from('stores')
      .update({ order_sequence: nextSequence })
      .eq('id', store_id);
    if (updateError) {
      err('Failed to update store sequence:', (updateError as any).message);
    }

    res.status(200).json({
      success: true,
      order_id: data?.id,
      order_number: orderNumber,
      payment_intent_id: intent.id
    });
  } catch (error: any) {
    err('Unexpected processing error:', error?.message || error);
    console.error('[Smoothr Checkout] RAW ERROR', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to process payment' });
  }
  } catch (error: any) {
    console.error('[Smoothr Checkout] Unhandled handler error:', error?.message || error);
    console.error('[Smoothr Checkout] RAW ERROR', JSON.stringify(error, null, 2));
    if (!res.headersSent) {
      res.status(500).json({ error: 'Unhandled checkout error' });
    }
  }
}
