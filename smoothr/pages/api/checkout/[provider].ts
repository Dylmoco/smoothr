// For example `/api/checkout/nmi` resolves to this dynamic route.
import type { NextApiRequest, NextApiResponse } from 'next';
import '../../../../shared/init';
import { handleCheckout } from 'shared/checkout/handleCheckout';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  console.log('[API] 🔥 [provider] API route hit');
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).end();
    return;
  }
  try {
    console.log('[API] invoking handleCheckout...');
    await handleCheckout({ req, res });
  } catch (err) {
    console.error('[API] ❌ Crash inside handleCheckout', err);
    res.status(500).json({ error: 'Internal server error (provider)' });
  }
}
