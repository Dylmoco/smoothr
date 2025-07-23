import type { NextApiRequest, NextApiResponse } from 'next';
import 'shared/init';
import { createServerSupabaseClient } from 'shared/supabase/serverClient';
import { createOrder } from 'shared/checkout/createOrder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createServerSupabaseClient();
  const origin = process.env.CORS_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    return res
      .status(200)
      .setHeader('Access-Control-Allow-Origin', origin)
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { store_id } = req.body as any;
    const { data: nextNumber, error } = await supabase.rpc(
      'increment_store_order_number',
      { store_id },
    );
    if (error || nextNumber == null) {
      throw new Error(error?.message || 'Failed to generate order number');
    }
    const order_number = `ORD-${String(nextNumber).padStart(4, '0')}`;
    const data = await createOrder({ ...req.body, order_number } as any);
    res.status(200).json(data);
  } catch (err: any) {
    console.error('[create-order] failed:', err);
    res.status(500).json({ error: err.message });
  }
}
