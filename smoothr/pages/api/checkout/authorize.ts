// Placeholder for future Authorize.net integration
// Here we will handle Accept.js token submissions or Accept Hosted redirect
// responses once gateway switching is implemented.

import { applyCors } from '../../../utils/cors';

export default function handler(req: any, res: any) {
  const origin = req.headers.origin || '*';

  if (req.method === 'OPTIONS') {
    applyCors(res, origin);
    res.status(200).end();
    return;
  }

  applyCors(res, origin);
  res.status(501).json({ error: 'Authorize.net integration not implemented' });
}
