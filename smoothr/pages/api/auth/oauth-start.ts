import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllowOrigin } from '../../../lib/cors';

function getBrokerOrigin(req: NextApiRequest): string {
  const envBase = process.env.NEXT_PUBLIC_BROKER_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/+$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string);
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  const provider = (req.query.provider as string) || 'google';
  const store_id = (req.query.store_id as string) || '';
  const orig = (req.query.orig as string) || '';
  const mode = (req.query.mode as string) || '';
  if (provider !== 'google' || !store_id || !orig) {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }
  const allow = await getAllowOrigin(orig, store_id);
  if (!allow) return res.status(400).json({ ok: false, error: 'Origin not allowed' });
  const cookieVal = encodeURIComponent(JSON.stringify({ store_id, orig }));
  res.setHeader('Set-Cookie', `smoothr_oauth_ctx=${cookieVal}; Max-Age=120; Path=/; SameSite=Lax`);
  const brokerOrigin = getBrokerOrigin(req);
  const supaUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const authorize = `https://${supaUrl.host}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
    brokerOrigin + '/auth/callback'
  )}`;
  if (mode === 'url') {
    res.setHeader('Access-Control-Allow-Origin', allow);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
    return res.status(200).json({ ok: true, authorizeUrl: authorize });
  }
  res.setHeader('Location', authorize);
  res.status(302).end();
}
