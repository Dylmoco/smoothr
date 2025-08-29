import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, supabaseAnonServer } from '../../../lib/supabaseAdmin';
import { getAllowOrigin } from '../../../lib/cors';

type Ok = {
  ok: true;
  redirect_url: string | null;
  sign_in_redirect_url: string | null;
  sign_out_redirect_url: string | null;
  features?: any;
};
type Err = { ok: false; error: string };
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  try {
    const origin = req.headers.origin;
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const store_id = body?.store_id;
    const allowOrigin = await getAllowOrigin(origin, store_id);
    if (!allowOrigin)
      return res.status(403).json({ ok: false, error: 'Origin not allowed' });

    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')
      return res
        .status(405)
        .json({ ok: false, error: 'Method Not Allowed' });

    const authz = req.headers.authorization || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';

    if (!token)
      return res.status(401).json({ ok: false, error: 'Missing bearer token' });
    if (!store_id)
      return res.status(400).json({ ok: false, error: 'Missing store_id' });

    // Verify Supabase access token
    const { data: userRes, error: userErr } = await supabaseAnonServer.auth.getUser(token);
    if (userErr || !userRes?.user) return res.status(401).json({ ok: false, error: 'Invalid access token' });

    const user = userRes.user;
    const email = user.email ?? null;

    // Upsert per-store customer record (adjust table/columns if your schema differs)
    await supabaseAdmin
      .from('customers')
      .upsert(
        { store_id, user_id: user.id, email, last_seen_at: new Date().toISOString() },
        { onConflict: 'store_id,user_id' }
      );

    // Fetch redirect candidates from your public settings/view.
    // Your schema exposes: sign_in_redirect_url, sign_out_redirect_url (no dashboard_home_url).
    let sign_in_redirect_url: string | null = null;
    let sign_out_redirect_url: string | null = null;

    const tryView = await supabaseAdmin
      .from('v_public_store')
      .select('sign_in_redirect_url, sign_out_redirect_url')
      .eq('store_id', store_id)
      .maybeSingle();

    if (!tryView.error && tryView.data) {
      sign_in_redirect_url = tryView.data.sign_in_redirect_url ?? null;
      sign_out_redirect_url = tryView.data.sign_out_redirect_url ?? null;
    } else {
      const trySettings = await supabaseAdmin
        .from('public_store_settings')
        .select('sign_in_redirect_url, sign_out_redirect_url')
        .eq('store_id', store_id)
        .maybeSingle();
      if (!trySettings.error && trySettings.data) {
        sign_in_redirect_url = trySettings.data.sign_in_redirect_url ?? null;
        sign_out_redirect_url = trySettings.data.sign_out_redirect_url ?? null;
      }
    }

    // Final redirect for login = sign_in_redirect_url (or null)
    const redirect_url = sign_in_redirect_url || null;

    // (Phase-2: set httpOnly cookie here)
    return res.status(200).json({
      ok: true,
      redirect_url,
      sign_in_redirect_url,
      sign_out_redirect_url,
      features: {}
    });
  } catch (e: any) {
    console.error('[session-sync] error', e);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
}
