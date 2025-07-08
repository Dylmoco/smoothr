import type { NextApiRequest, NextApiResponse } from 'next';

import handleAuthorizeNet from '../../../../shared/checkout/providers/authorizeNet';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TEST] \ud83d\udd25 API route /api/checkout/authorizeNet is live and running');
  const result = await handleAuthorizeNet(req.body);
  res.status(result.success ? 200 : 500).json(result);
}
