import { useEffect } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

interface Props {
  destOrigin: string | null;
  storeId: string | null;
  error?: string | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const storeId = Array.isArray(query.store_id) ? query.store_id[0] : (query.store_id as string) || '';
  if (!storeId) {
    return { props: { destOrigin: null, storeId: '', error: 'Missing store_id' } };
  }
  let destOrigin: string | null = null;
  try {
    const { data } = await supabaseAdmin
      .from('stores')
      .select('store_domain, live_domain')
      .eq('id', storeId)
      .maybeSingle();
    const domain = data?.live_domain || data?.store_domain || '';
    if (domain) {
      try {
        const url = new URL(`https://${domain}`);
        destOrigin = `https://${url.hostname}`;
      } catch {}
    }
  } catch (err) {
    console.error('[recovery-bridge] lookup failed', err);
  }
  if (!destOrigin) {
    return { props: { destOrigin: null, storeId, error: 'Unable to determine redirect destination.' } };
  }
  return { props: { destOrigin, storeId } };
};

export default function RecoveryBridge({ destOrigin, storeId, error }: Props) {
  useEffect(() => {
    if (!destOrigin || !storeId) return;
    const hash = window.location.hash || '';
    const target = `${destOrigin}/reset-password?store_id=${encodeURIComponent(storeId)}${hash}`;
    const link = document.getElementById('smoothr-bridge-link') as HTMLAnchorElement | null;
    if (link) link.href = target;
    window.location.replace(target);
  }, [destOrigin, storeId]);

  if (!destOrigin || error) {
    return (
      <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
        <p>{error || 'Missing or invalid store configuration.'}</p>
      </main>
    );
  }

  const fallback = `${destOrigin}/reset-password?store_id=${encodeURIComponent(storeId || '')}`;

  return (
    <>
      <Head><title>Redirecting...</title></Head>
      <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
        <p>Redirecting…</p>
        <p><a id="smoothr-bridge-link" href={fallback}>Continue</a></p>
      </main>
    </>
  );
}

