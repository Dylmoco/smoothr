import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, supabaseAnonServer } from '../../../lib/supabaseAdmin';

type Ok = { ok: true; dashboard_home_url: string | null; features?: any };
type Err = { ok: false; error: string };
export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  // CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  try {
    const authz = req.headers.authorization || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const store_id = body?.store_id;

    if (!token) return res.status(401).json({ ok: false, error: 'Missing bearer token' });
    if (!store_id) return res.status(400).json({ ok: false, error: 'Missing store_id' });

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

    // Get dashboard_home_url from your public view/settings
    let dashboard_home_url: string | null = null;

    const vres = await supabaseAdmin
      .from('v_public_store')
      .select('dashboard_home_url')
      .eq('store_id', store_id)
      .maybeSingle();

    if (!vres.error && vres.data) {
      dashboard_home_url = vres.data.dashboard_home_url ?? null;
    } else {
      const sres = await supabaseAdmin
        .from('public_store_settings')
        .select('dashboard_home_url')
        .eq('store_id', store_id)
        .maybeSingle();
      if (!sres.error && sres.data) dashboard_home_url = sres.data.dashboard_home_url ?? null;
    }

    // (Phase-2 will add an httpOnly smoothr_sid cookie; omitted for MVP.)
    return res.status(200).json({ ok: true, dashboard_home_url, features: {} });
  } catch (e: any) {
    console.error('[session-sync] error', e);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
}
