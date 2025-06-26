import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { NextApiRequest, NextApiResponse } from 'next';

// Reminder: ensure your Supabase project has an `orders` table and
// `payment_gateways` table to track purchases and gateway configs.

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { amount, email, product_id } = req.body as {
    amount: number;
    email: string;
    product_id: string;
  };

  try {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: email,
      automatic_payment_methods: { enabled: true }
    });

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('orders').insert({
      user_id: null,
      email,
      product_id,
      amount,
      gateway: 'stripe',
      status: 'pending'
    });

    res.status(200).json({ client_secret: intent.client_secret });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
