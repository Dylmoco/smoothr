import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

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
        if (mounted) setEmail(data?.user?.email ?? null);
        if (mounted) setReady(true);
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
      </Head>
      <main
        style={{
          maxWidth: 420,
          margin: '64px auto',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Set your password</h1>
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          {email ? (
            <>
              For <strong>{email}</strong>
            </>
          ) : (
            'Complete your password reset.'
          )}
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
              style={{
                padding: 10,
                border: '1px solid #ddd',
                textAlign: 'center',
                cursor: busy ? 'wait' : 'pointer',
                opacity: ready ? 1 : 0.6,
              }}
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
