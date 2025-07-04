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
  const origin = req.headers.origin as string | undefined;
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(403).end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin);
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
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      warn('Rejecting request: empty cart');
      res.status(400).json({ error: 'Cart cannot be empty' });
      return;
    }

    if (total <= 0) {
      warn('Rejecting request: invalid total');
      res.status(400).json({ error: 'Invalid total' });
      return;
    }

    const { name, address } = shipping;
    const { line1, line2, city, state, postal_code, country } = address || {};
    if (!name || !line1 || !city || !postal_code || !state || !country) {
      warn('Rejecting request: invalid shipping details');
      res.status(400).json({ error: 'Invalid shipping details' });
      return;
    }

    // Stripe metadata values have a 500 character limit. Only store the most
    // essential cart details to avoid exceeding this limit.
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
    } catch (err: any) {
      err('findOrCreateCustomer failed:', err?.message || err);
      res.status(500).json({ error: 'Failed to record customer' });
      return;
    }

    // Fetch store prefix and current order sequence
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('prefix, order_sequence')
      .eq('id', store_id)
      .maybeSingle();

    if (storeError) {
      err('Store lookup failed:', (storeError as any).message);
      res.status(500).json({ error: 'Failed to fetch store information' });
      return;
    }

    if (!storeData) {
      res.status(400).json({ error: 'Invalid store_id' });
      return;
    }

    const { prefix, order_sequence } = storeData as any;

    if (!prefix) {
      err('Store prefix missing');
      res.status(500).json({ error: 'Store configuration invalid' });
      return;
    }

    if (order_sequence === null || order_sequence === undefined) {
      err('order_sequence missing for store');
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
        // Include cart items for backward compatibility with
        // environments where the `orders` table still has an
        // `items` column. Newer schemas ignore extra fields.
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
  } catch (err: any) {
    err('Unexpected processing error:', err?.message || err);
    res.status(500).json({ error: 'Failed to process payment' });
  }
}
