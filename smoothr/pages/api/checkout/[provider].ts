import type { NextApiRequest, NextApiResponse } from 'next';
import { handleCheckout } from 'shared/checkout/handleCheckout';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await handleCheckout({ req, res });
}
