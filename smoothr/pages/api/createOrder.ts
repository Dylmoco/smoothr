import type { NextApiRequest, NextApiResponse } from 'next';
import 'shared/init';
import { createSupabaseClient } from 'shared/supabase/client';
import { createOrder } from 'shared/checkout/createOrder';
import { applyCors } from 'shared/utils/applyCors';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createSupabaseClient();
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
    type CreateOrderInput = Parameters<typeof createOrder>[0];
    const body = req.body as CreateOrderInput & { store_id: string };
    const { store_id, ...rest } = body;
    const { data: nextNumber, error } = await supabase.rpc(
      'increment_store_order_number',
      { store_id },
    );
    if (error || nextNumber == null) {
      throw new Error(error?.message || 'Failed to generate order number');
    }
    const order_number = `ORD-${String(nextNumber).padStart(4, '0')}`;
    const payload: CreateOrderInput = { ...rest, order_number } as CreateOrderInput;
    const data = await createOrder(payload);
    res.status(200).json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
