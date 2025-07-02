import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import supabase from '../../../../shared/supabase/serverClient';
import { findOrCreateCustomer } from '../../../../shared/customers/findOrCreate';
import { applyCors } from '../../../utils/cors';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

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
  const origin = req.headers.origin || '*';

  if (req.method === 'OPTIONS') {
    applyCors(res, origin);
    res.status(200).end();
    return;
  }

  applyCors(res, origin);

  console.log('[Smoothr Checkout] Incoming payload:', req.body);
  if (!req.body.email) console.warn('Missing email');
  if (!req.body.payment_method) console.warn('Missing payment_method');
  if (!Array.isArray(req.body.cart) || req.body.cart.length === 0)
    console.warn('Invalid or empty cart');
  if (!req.body.total || req.body.total <= 0)
    console.warn('Missing or invalid total');
  if (!req.body.currency) console.warn('Missing currency');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
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
      console.warn('[Smoothr Checkout] Rejecting request: missing required fields');
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      console.warn('[Smoothr Checkout] Rejecting request: empty cart');
      res.status(400).json({ error: 'Cart cannot be empty' });
      return;
    }

    if (total <= 0) {
      console.warn('[Smoothr Checkout] Rejecting request: invalid total');
      res.status(400).json({ error: 'Invalid total' });
      return;
    }

    const { name, address } = shipping;
    const { line1, line2, city, state, postal_code, country } = address || {};
    if (!name || !line1 || !city || !postal_code || !state || !country) {
      console.warn('[Smoothr Checkout] Rejecting request: invalid shipping details');
      res.status(400).json({ error: 'Invalid shipping details' });
      return;
    }

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
        cart: JSON.stringify(cart)
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
    });

    let customerId: string | null = null;
    try {
      customerId = await findOrCreateCustomer(supabase, store_id, email);
    } catch (err: any) {
      console.error('Supabase customer error:', err);
      res.status(500).json({ error: 'Failed to record customer' });
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        status: 'processing',
        payment_provider: 'stripe',
        raw_data: req.body,
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
      console.error('Supabase order insert error:', error.message);
      res.status(500).json({ error: 'Failed to record order' });
      return;
    }

    res.status(200).json({
      success: true,
      order_id: data?.id,
      payment_intent_id: intent.id
    });
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ error: 'Failed to process payment' });
  }
}
