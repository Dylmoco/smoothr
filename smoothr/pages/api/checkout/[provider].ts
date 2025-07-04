import type { NextApiRequest, NextApiResponse } from 'next';
import { handleCheckout } from '../../../../shared/checkout/handleCheckout';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providerParam = req.query.provider;
  const provider = Array.isArray(providerParam) ? providerParam[0] : providerParam || '';
  await handleCheckout({ provider, req, res });
}
