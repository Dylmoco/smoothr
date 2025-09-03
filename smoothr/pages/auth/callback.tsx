import React from 'react';
import { createClient } from '@supabase/supabase-js';

export async function handleAuthCallback(w: any = window) {
  const hash = w.location?.hash || '';
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return { ok: false };
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const {
    data: { session }
  } = await supabase.auth.setSession({ access_token, refresh_token });
  w.history?.replaceState?.(null, '', w.location?.pathname + w.location?.search);
  let store_id: string | null = null;
  let orig: string | null = null;
  try {
    const cookie = w.document?.cookie || '';
    const match = cookie.split('; ').find((c: string) => c.startsWith('smoothr_oauth_ctx='));
    if (match) {
      const value = decodeURIComponent(match.split('=')[1] || '');
      const parsed = JSON.parse(value);
      store_id = parsed.store_id || null;
      orig = parsed.orig || null;
    }
  } catch {}
  if (!store_id) {
    store_id =
      (session?.user as any)?.user_metadata?.store_id ||
      new URLSearchParams(w.location.search).get('store_id') ||
      w.SMOOTHR_CONFIG?.store_id ||
      null;
  }
  if (!store_id || !session) return { ok: false };
  if (w.opener) {
    try {
      w.opener.postMessage(
        { type: 'smoothr:oauth', ok: true, access_token, store_id },
        orig || '*'
      );
    } catch {}
    try { w.close(); } catch {}
    return { ok: true };
  }
  const form = w.document.createElement('form');
  form.method = 'POST';
  form.action = '/api/auth/session-sync';
  const f1 = w.document.createElement('input');
  f1.type = 'hidden';
  f1.name = 'store_id';
  f1.value = store_id;
  form.appendChild(f1);
  const f2 = w.document.createElement('input');
  f2.type = 'hidden';
  f2.name = 'access_token';
  f2.value = access_token;
  form.appendChild(f2);
  w.document.body.appendChild(form);
  form.submit();
  return { ok: true };
}

export default function OAuthCallbackPage() {
  React.useEffect(() => {
    handleAuthCallback().catch(() => {});
  }, []);
  return null;
}
