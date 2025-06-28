import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { NextApiRequest, NextApiResponse } from 'next';

// Reminder: ensure your Supabase project has an `orders` table and
// `payment_gateways` table to track purchases and gateway configs.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
} as const;

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔥 Checkout API hit');
  console.log('✅ Method: ', req.method);
  console.log('🧾 Body: ', req.body);
  console.log('🔑 STRIPE_SECRET_KEY present: ', !!process.env.STRIPE_SECRET_KEY);

  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, CORS_HEADERS);
      res.end();
      return;
    }

    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { amount, email, product_id } = req.body as {
      amount: number;
      email?: string;
      product_id: string;
    };

    if (!amount) {
      console.error('❌ Missing required fields:', { amount });
      res.status(400).json({ error: 'Missing required field: amount' });
      return;
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      ...(email ? { receipt_email: email } : {}),
      automatic_payment_methods: { enabled: true }
    });
    console.log('✅ Stripe PaymentIntent created:', intent.id);

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('orders').insert({
      user_id: null,
      email: email || null,
      product_id,
      amount,
      gateway: 'stripe',
      status: 'pending',
      payment_intent_id: intent.id
    });

    res.status(200).json({ client_secret: intent.client_secret });
  } catch (err: any) {
    console.error('❌ Stripe creation error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
