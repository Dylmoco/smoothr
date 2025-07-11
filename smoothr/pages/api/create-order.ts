import type { NextApiRequest, NextApiResponse } from 'next';
import 'shared/init';
import { createOrder } from 'shared/checkout/createOrder';

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

  try {
    const data = await createOrder(req.body as any);
    res.status(200).json(data);
  } catch (err: any) {
    console.error('[create-order] failed:', err);
    res.status(500).json({ error: err.message });
  }
}
