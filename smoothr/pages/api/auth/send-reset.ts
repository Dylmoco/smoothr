import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { sendEmail } from '../../../lib/email/send';
import { renderResetEmail } from '../../../lib/email/templates/reset';

type Ok = { ok: true };
type Err = { ok: false; error: string };

function getBrokerOrigin(req: NextApiRequest): string {
  // Prefer NEXT_PUBLIC_… if set, else infer from host header
  const envBase = process.env.NEXT_PUBLIC_BROKER_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/+$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string);
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    const { email, store_id, redirectTo } = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
    if (!email || !store_id) return res.status(400).json({ ok: false, error: 'Missing email or store_id' });

    const supabase = getSupabaseAdmin();

    // Pull minimal branding
    const { data: store } = await supabase.from('stores').select('store_name').eq('id', store_id).maybeSingle();
    const { data: settings } = await supabase.from('public_store_settings').select('logo').eq('store_id', store_id).maybeSingle();

    // Build redirectTo if SDK didn’t supply
    const origin = getBrokerOrigin(req);
    const dest = redirectTo && typeof redirectTo === 'string'
      ? redirectTo
      : `${origin}/auth/recovery-bridge?store_id=${encodeURIComponent(store_id)}&orig=${encodeURIComponent(origin)}`;

    // Generate Supabase recovery link
    // NOTE: supabase-js v2 admin.generateLink supports redirectTo
    // https://supabase.com/docs/reference/javascript/auth-admin-generatelink
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: dest },
    } as any);
    if (linkErr || !linkData?.action_link) {
      return res.status(500).json({ ok: false, error: linkErr?.message || 'link_error' });
    }

    const actionLink = linkData.action_link as string;
    const storeName = store?.store_name || 'Your Store';
    const logoUrl = (settings as any)?.logo || null;

    const { subject, html, text } = renderResetEmail({ storeName, logoUrl, actionLink });

    const send = await sendEmail({
      to: email,
      subject,
      html,
      text,
      from: process.env.EMAIL_FROM || `Smoothr <no-reply@smoothr.io>`,
    });

    if (!send.ok) return res.status(502).json({ ok: false, error: send.error });

    // Uniform response (avoid user enumeration details)
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('[send-reset] error', e);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
}
