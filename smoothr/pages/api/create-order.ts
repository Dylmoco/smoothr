import type { NextApiRequest, NextApiResponse } from 'next';
import 'shared/init';
import supabase from 'shared/supabase/serverClient';

const generateOrderNumber =
  (globalThis as any).generateOrderNumber as (storeId: string) => Promise<string>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'OPTIONS') {
    return res
      .status(200)
      .setHeader('Access-Control-Allow-Origin', 'https://smoothr-cms.webflow.io')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  res.setHeader('Access-Control-Allow-Origin', 'https://smoothr-cms.webflow.io');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const {
    email,
    name,
    cart,
    total_price,
    currency,
    gateway,
    shipping,
    billing,
    store_id,
  } = req.body as Record<string, any>;

  if (!store_id) {
    res.status(400).json({ error: 'store_id is required' });
    return;
  }

  let orderNumber: string;
  try {
    orderNumber = await generateOrderNumber(store_id);
  } catch (err: any) {
    console.error('[create-order] generateOrderNumber failed:', err);
    res.status(500).json({ error: 'Failed to generate order number' });
    return;
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      status: 'unpaid',
      payment_status: 'unpaid',
      payment_provider: gateway,
      total_price,
      store_id,
      customer_email: email,
      raw_data: { email, name, cart, total_price, currency, gateway, shipping, billing },
    })
    .select('*')
    .single();

  if (error) {
    console.error('[create-order] insert failed:', error);
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json(data);
}
