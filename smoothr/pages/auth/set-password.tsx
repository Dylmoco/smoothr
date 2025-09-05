import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import { loadStoreTheme } from '../../lib/branding';
import type { Theme } from '../../lib/branding';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Props {
  accessToken: string;
  refreshToken: string;
  storeId: string;
  redirectTo: string | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const type = typeof query.type === 'string' ? query.type : '';
  const tokenHash = typeof query.token_hash === 'string' ? query.token_hash : '';
  const storeId = typeof query.store_id === 'string' ? query.store_id : '';
  let accessToken = '';
  let refreshToken = '';
  let redirectTo: string | null = null;

  if (type === 'recovery' && tokenHash) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    try {
      const { data } = await (admin as any).auth.admin.generateLink({
        type: 'recovery',
        token_hash: tokenHash,
      });
      const link = data?.properties?.action_link || '';
      const url = new URL(link);
      accessToken = url.searchParams.get('access_token') || '';
      refreshToken = url.searchParams.get('refresh_token') || '';
    } catch {}
    try {
      const { data: row } = await admin
        .from('auth_state_management')
        .select('metadata')
        .eq('token_hash', tokenHash)
        .maybeSingle();
      redirectTo = (row?.metadata as any)?.redirect_to || null;
    } catch {}
  }

  return {
    props: { accessToken, refreshToken, storeId, redirectTo },
  };
};

export default function SetPasswordPage({ accessToken, refreshToken, storeId, redirectTo }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setEmail(data?.user?.email ?? null);
        if (storeId) {
          try {
            const t = await loadStoreTheme(storeId);
            setTheme(t);
          } catch {}
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [accessToken, refreshToken, storeId]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (pwd.length < 8) return setMsg('Password must be at least 8 characters.');
      if (pwd !== pwd2) return setMsg('Passwords do not match.');
      setBusy(true);
      setMsg(null);
      try {
        const { error } = await supabase.auth.updateUser({ password: pwd });
        if (error) throw error;
        const dest = redirectTo || '/';
        if (typeof window !== 'undefined') {
          window.location.replace(dest);
        }
      } catch (err: any) {
        setMsg(err?.message || 'Something went wrong');
        setBusy(false);
      }
    },
    [pwd, pwd2, redirectTo],
  );

  return (
    <>
      <Head>
        <title>Set your password</title>
        {theme && (
          <style>{`
            body{background:${theme.bg};color:${theme.text};font-family:${theme.fontFamily}}
            .card{max-width:440px;margin:64px auto;padding:24px;background:#fff;border:1px solid #e5e5e5;border-radius:16px}
            .btn{padding:12px 16px;border-radius:${theme.btnRadius}px;border:1px solid #d0d0d0;background:${theme.primary};color:#fff;text-align:center;cursor:pointer}
            .logo{max-width:180px;display:block;margin:0 auto 16px}
            .hint{color:${theme.muted}}
            input{padding:10px 12px;border:1px solid #ddd;border-radius:10px}
          `}</style>
        )}
      </Head>
      <main className="card">
        {theme?.logoUrl && <img className="logo" src={theme.logoUrl} alt={email || 'Store logo'} />}
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
            {busy ? (
              <div className="spinner" style={{ textAlign: 'center' }}>Saving...</div>
            ) : (
              <button type="submit" className="btn">Save password</button>
            )}
          </div>
        </form>
        {msg && <p style={{ color: 'crimson', marginTop: 12 }}>{msg}</p>}
      </main>
    </>
  );
}

