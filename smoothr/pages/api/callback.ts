import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // For password recovery flows we route to our Set Password page.
  const { store_id } = req.query;
  const base = '/auth/set-password';
  const loc = store_id ? `${base}?store_id=${encodeURIComponent(String(store_id))}` : base;
  res.setHeader('Location', loc);
  res.status(302).end();
}
