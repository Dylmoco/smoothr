// Placeholder for future Authorize.net integration
// Here we will handle Accept.js token submissions or Accept Hosted redirect
// responses once gateway switching is implemented.

export default function handler(req: any, res: any) {
  res.status(501).json({ error: 'Authorize.net integration not implemented' });
}
