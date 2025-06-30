import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import supabase from '../../../../shared/supabase/serverClient';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

interface ShippingInfo {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  state: string;
  country: string;
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
  description?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      !currency
    ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      res.status(400).json({ error: 'Cart cannot be empty' });
      return;
    }

    if (total <= 0) {
      res.status(400).json({ error: 'Invalid total' });
      return;
    }

    const { line1, line2, city, postcode, state, country } = shipping;
    if (!line1 || !city || !postcode || !state || !country) {
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
        name: `${first_name} ${last_name}`,
        address: {
          line1,
          line2: line2 || undefined,
          city,
          postal_code: postcode,
          state,
          country
        }
      }
    });

    const { data, error } = await supabase
      .from('orders')
      .insert({
        status: 'processing',
        payment_provider: 'stripe',
        raw_data: req.body,
        total,
        currency,
        email,
        cart,
        payment_intent_id: intent.id
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
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
