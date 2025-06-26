import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import supabase from '../../../../shared/supabase/serverClient';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

async function readBuffer(readable: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  let event: Stripe.Event;
  try {
    const buf = await readBuffer(req);
    const signature = req.headers['stripe-signature'] || '';
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Stripe webhook error', err);
    }
    res.status(400).send(`Webhook Error: ${err.message || 'Invalid payload'}`);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('Stripe webhook event:', event.type);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const id = paymentIntent.id;
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('payment_intent_id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Order not found for payment_intent ${id}`);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Supabase update error:', err);
      }
      res.status(400).send('Webhook processing error');
      return;
    }
  }

  res.status(200).json({ received: true });
}
