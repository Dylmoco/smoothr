import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createServerSupabaseClient } from 'shared/supabase/serverClient';
import { getStoreIntegration } from 'shared/checkout/getStoreIntegration';
import { applyCors } from 'shared/utils/applyCors';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[create-checkout]', ...args);
const err = (...args: any[]) => debug && console.error('[create-checkout]', ...args);

const SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'NZD', 'SGD',
  'CHF', 'HKD', 'SEK', 'DKK', 'NOK'
]);

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin || '*';
  try {
    if (req.method === 'OPTIONS') {
      applyCors(res, origin);
      res.status(200).end();
      return;
    }

    applyCors(res, origin);

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { baseCurrency, cart, store_id } = req.body as {
      baseCurrency: string;
      cart: CartItem[];
      store_id?: string;
    };

    if (!store_id) {
      res.status(400).json({ error: 'store_id required' });
      return;
    }

    const supabase = createServerSupabaseClient();
    let stripeSecret = '';
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('settings')
        .eq('store_id', store_id)
        .maybeSingle();
      stripeSecret = data?.settings?.stripe_secret_key || '';
    } catch (e) {
      err('Store settings lookup failed:', e);
    }

    if (!stripeSecret.trim()) {
      const integration = await getStoreIntegration(store_id, 'stripe');
      stripeSecret =
        integration?.settings?.secret_key || integration?.api_key || '';
    }

    if (!stripeSecret.trim()) {
      throw new Error('Stripe secret key not configured for store');
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

    const currency = baseCurrency?.toUpperCase();
    if (!currency || !SUPPORTED_CURRENCIES.has(currency)) {
      res.status(400).json({ error: 'Invalid or unsupported baseCurrency' });
      return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      res.status(400).json({ error: 'Cart is required' });
      return;
    }

    for (const item of cart) {
      if (!item.product_id || !item.name) {
        res.status(400).json({ error: 'Invalid cart item' });
        return;
      }
      if (!Number.isInteger(item.price) || item.price <= 0) {
        res.status(400).json({ error: 'Invalid item price' });
        return;
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        res.status(400).json({ error: 'Invalid item quantity' });
        return;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: currency.toLowerCase(),
      line_items: cart.map(item => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: item.name },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      success_url: `${req.headers.origin}/checkout-success`,
      cancel_url: 'https://yourdomain.com/cart',
      metadata: {
        baseCurrency: currency,
        // Store a compact cart representation to respect Stripe's 500 character
        // metadata limit.
        cart: JSON.stringify(
          cart.map(i => ({ id: i.product_id, qty: i.quantity }))
        ).slice(0, 500),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    err('❌ Stripe session error:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
