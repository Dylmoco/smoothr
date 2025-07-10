import type { NextApiRequest, NextApiResponse } from 'next';
import '../../../../../shared/init';
import { handleCheckout } from 'shared/checkout/handleCheckout';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API] 🔥 [provider] API route hit');
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).end();
    return;
  }
  await handleCheckout({ req, res });
}
