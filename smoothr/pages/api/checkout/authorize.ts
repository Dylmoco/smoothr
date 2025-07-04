// Placeholder for future Authorize.net integration
// Here we will handle Accept.js token submissions or Accept Hosted redirect
// responses once gateway switching is implemented.

export default function handler(req: any, res: any) {
  const origin = req.headers.origin || '*';

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    res.status(200).end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.status(501).json({ error: 'Authorize.net integration not implemented' });
}
