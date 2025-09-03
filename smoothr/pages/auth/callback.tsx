// Minimal OAuth callback handler with zero UI.

export function handleAuthCallback(w = window) {
  const hash = w.location?.hash || '';
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const access_token = params.get('access_token') || '';
  const refresh_token = params.get('refresh_token') || '';
  try { w.history?.replaceState?.(null, '', w.location?.pathname + w.location?.search); } catch {}

  let store_id: string | null = null;
  let orig: string | null = null;
  try {
    const cookie = w.document?.cookie || '';
    const match = cookie.split('; ').find(c => c.startsWith('smoothr_oauth_ctx='));
    if (match) {
      const value = decodeURIComponent(match.split('=')[1] || '');
      const parsed = JSON.parse(value);
      store_id = parsed.store_id || null;
      orig = parsed.orig || null;
    }
  } catch {}

  if (w.opener) {
    if (access_token && refresh_token && store_id && orig) {
      try {
        w.opener.postMessage(
          {
            type: 'smoothr_oauth_success',
            access_token,
            refresh_token,
            store_id,
          },
          orig,
        );
      } catch {}
      try { w.close(); } catch {}
      return { ok: true };
    }
    try { w.close(); } catch {}
    return { ok: false };
  }

  if (access_token && refresh_token && store_id) {
    try { w.document?.documentElement && (w.document.documentElement.style.visibility = 'hidden'); } catch {}
    const form = w.document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/session-sync';
    form.style.display = 'none';
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
    const f3 = w.document.createElement('input');
    f3.type = 'hidden';
    f3.name = 'refresh_token';
    f3.value = refresh_token;
    form.appendChild(f3);
    w.document.body.appendChild(form);
    try { form.submit(); } catch {}
    return { ok: true };
  }

  try { w.location?.replace?.('/'); } catch {}
  return { ok: false };
}

export default function OAuthCallbackPage() {
  return null;
}

if (typeof document !== 'undefined') {
  try { document.documentElement.style.visibility = 'hidden'; } catch {}
}
if (typeof window !== 'undefined') {
  try { handleAuthCallback(window); } catch {}
}

