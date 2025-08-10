import type { NextApiRequest, NextApiResponse } from 'next';
import 'shared/init';
import { createServerSupabaseClient } from '../../../shared/supabase/serverClient.js';
import { createOrder } from '../../../shared/checkout/createOrder.js';
import { applyCors } from '../../../shared/utils/applyCors.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createServerSupabaseClient();
  const origin = process.env.CORS_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    applyCors(res, origin);
    return res.status(200).end();
  }

  applyCors(res, origin);
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
    console.error('[createOrder] failed:', err);
    res.status(500).json({ error: err.message });
  }
}
