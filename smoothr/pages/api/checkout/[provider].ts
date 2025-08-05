// For example `/api/checkout/nmi` resolves to this dynamic route.
import type { NextApiRequest, NextApiResponse } from 'next';
import '../../../../shared/init';
import { handleCheckout } from 'shared/checkout/handleCheckout';
import { applyCors } from '../../../utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = process.env.CORS_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    applyCors(res, origin);
    return res.status(200).end();
  }

  applyCors(res, origin);

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
