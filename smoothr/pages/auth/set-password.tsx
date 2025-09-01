import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { loadStoreTheme } from '../../lib/branding';
import type { Theme } from '../../lib/branding';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function SetPasswordPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);

  // NEW: hydrate session from recovery hash if present, then strip hash
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          if (typeof history !== 'undefined' && history.replaceState) {
            history.replaceState(null, '', window.location.pathname);
          } else {
            window.location.hash = '';
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[set-password] setSession from hash failed', e);
      } finally {
        // load email for display once session (if any) is ready
        const { data } = await supabase.auth.getUser();
        if (mounted) {
          setEmail(data?.user?.email ?? null);
          const storeId =
            (data?.user as any)?.user_metadata?.store_id ||
            (window as any).__SMOOTHR_STORE_ID__ ||
            '';
          if (storeId) {
            try {
              const t = await loadStoreTheme(storeId);
              setTheme(t);
            } catch {
              // ignore theme load errors
            }
          }
          setReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (pwd.length < 8) return setMsg('Password must be at least 8 characters.');
      if (pwd !== pwd2) return setMsg('Passwords do not match.');
      setBusy(true);
      setMsg(null);

      try {
        // Require an active session (either from hash we just set, or pre-existing)
        const { data: sess0 } = await supabase.auth.getSession();
        if (!sess0?.session) {
          setMsg('Recovery link is missing or expired. Please request a new link.');
          setBusy(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({ password: pwd });
        if (error) throw error;

        // Pull store_id from session metadata (bridge removed it from URL by design)
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token || '';
        const storeId =
          (sess?.session?.user as any)?.user_metadata?.store_id ||
          (window as any).__SMOOTHR_STORE_ID__ || '';

        if (!token) {
          setMsg('Something went wrong (no session). Please request a new link.');
          setBusy(false);
          return;
        }
        if (!storeId) {
          setMsg('Something went wrong (no store). Please contact support.');
          setBusy(false);
          return;
        }

        // Session handoff: POST to /api/auth/session-sync (303 to store)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/auth/session-sync';
        form.enctype = 'application/x-www-form-urlencoded';
        form.target = '_self';

        const mk = (name: string, value: string) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };

        mk('store_id', storeId);
        mk('access_token', token);
        document.body.appendChild(form);
        form.submit();
        return;
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('[set-password] error', err);
        setMsg(err?.message || 'Something went wrong');
        setBusy(false);
      }
    },
    [pwd, pwd2],
  );

  return (
    <>
      <Head>
        <title>Set your password</title>
        {theme?.customCssUrl ? <link rel="stylesheet" href={theme.customCssUrl} /> : null}
        {theme ? (
          <style>{`
            :root {
              --brand-bg: ${theme.bg};
              --brand-text: ${theme.text};
              --brand-muted: ${theme.muted};
              --brand-primary: ${theme.primary};
              --brand-btn-radius: ${theme.btnRadius}px;
              --brand-font: ${theme.fontFamily};
            }
            body { background: var(--brand-bg); font-family: var(--brand-font); color: var(--brand-text); }
            .card { max-width: 440px; margin: 64px auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 16px; background: #fff; }
            .btn { padding: 12px 16px; border-radius: var(--brand-btn-radius); border: 1px solid #d0d0d0; background: var(--brand-primary); color: #fff; text-align: center; cursor: pointer; }
            .btn[aria-disabled="true"] { opacity: .6; cursor: not-allowed; }
            .logo { max-width: 180px; display:block; margin: 0 auto 16px; }
            .hint { color: var(--brand-muted); }
            input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; }
          `}</style>
        ) : null}
      </Head>
      <main className="card">
        {theme?.logoUrl
          ? <img className="logo" src={theme.logoUrl} alt={email || 'Store logo'} />
          : <div style={{fontWeight:700, fontSize:18, textAlign:'center', marginBottom:16}}>{email ? '' : 'Reset your password'}</div>}
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Set your password</h1>
        <p className="hint" style={{ marginBottom: 16 }}>
          {email ? <>For <strong>{email}</strong></> : 'Complete your password reset.'}
        </p>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              type="password"
              placeholder="New password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              required
            />
            <div
              role="button"
              tabIndex={0}
              onClick={onSubmit as any}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit(e as any);
              }}
              className="btn"
              aria-disabled={!ready}
            >
              {busy ? 'Saving…' : ready ? 'Save password' : 'Loading…'}
            </div>
          </div>
        </form>
        {msg && (
          <p style={{ color: 'crimson', marginTop: 12 }}>
            {msg}
          </p>
        )}
      </main>
    </>
  );
}
