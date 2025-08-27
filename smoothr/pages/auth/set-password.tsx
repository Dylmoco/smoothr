import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SetPasswordPage() {
  const { query } = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [pwd, setPwd] = useState(''); const [pwd2, setPwd2] = useState('');
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => { if (mounted) setEmail(data?.user?.email ?? null) });
    return () => { mounted = false; };
  }, []);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) return setMsg('Password must be at least 8 characters.');
    if (pwd !== pwd2) return setMsg('Passwords do not match.');
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;

      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const store_id = (query.store_id as string) || null;

      const resp = await fetch('/api/auth/session-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ store_id }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.ok) throw new Error(json?.error || 'Sync failed');

      Router.replace(json.dashboard_home_url || '/');
    } catch (err: any) {
      console.error('[set-password] error', err);
      setMsg(err?.message || 'Something went wrong'); setBusy(false);
    }
  }, [pwd, pwd2, query.store_id]);

  return (
    <>
      <Head><title>Set your password</title></Head>
      <main style={{ maxWidth: 420, margin: '64px auto', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Set your password</h1>
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          {email ? <>For <strong>{email}</strong></> : 'Complete your password reset.'}
        </p>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input type="password" placeholder="New password" value={pwd} onChange={e => setPwd(e.target.value)} required />
            <input type="password" placeholder="Confirm new password" value={pwd2} onChange={e => setPwd2(e.target.value)} required />
            <div role="button" tabIndex={0} onClick={onSubmit as any} onKeyDown={(e)=>{if(e.key==='Enter') onSubmit(e as any)}} style={{ padding: 10, border: '1px solid #ddd', textAlign: 'center', cursor: 'pointer' }}>
              {busy ? 'Saving…' : 'Save password'}
            </div>
          </div>
        </form>
        {msg && <p style={{ color: 'crimson', marginTop: 12 }}>{msg}</p>}
      </main>
    </>
  );
}
