import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { resolveRecoveryDestination } from '../../../shared/auth/resolveRecoveryDestination';

interface Props {
  redirect?: string | null;
  error?: string | null; // 'NO_ALLOWED_ORIGIN' | message
  auto?: '1' | null;
  brokerHost?: string | null;
  storeName?: string | null;
}
export const getServerSideProps: GetServerSideProps<Props> = async ({ query, req }) => {
  const storeId = Array.isArray(query.store_id) ? query.store_id[0] : (query.store_id as string) || '';
  const auto = Array.isArray(query.auto) ? query.auto[0] : (query.auto as string) || null;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string);
  const brokerOrigin = `${proto}://${host}`;
  if (!storeId) {
    return { props: { redirect: null, error: 'Missing store_id', auto: auto === '1' ? '1' : null, brokerHost: host || null } };
  }
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1) Fetch domains & name from stores
    const { data: storeRow } = await supabaseAdmin
      .from('stores')
      .select('store_domain, live_domain, store_name')
      .eq('id', storeId)
      .single();

    // 2) Resolve destination using allowlist logic
    const orig = Array.isArray(query.orig) ? query.orig[0] : (query.orig as string) || null;
    const res = resolveRecoveryDestination({
      liveDomain: storeRow?.live_domain ?? null,
      storeDomain: storeRow?.store_domain ?? null,
      signInRedirectUrl: null,
      orig,
      nodeEnv: process.env.NODE_ENV,
    });

    if (res.type === 'ok') {
      const dest = new URL('/reset-password', brokerOrigin);
      return {
        props: {
          redirect: dest.toString(),
          error: null,
          auto: auto === '1' ? '1' : null,
          brokerHost: host || null,
          storeName: storeRow?.store_name ?? null,
        },
      };
    }

    return {
      props: {
        redirect: null,
        error: 'NO_ALLOWED_ORIGIN',
        auto: auto === '1' ? '1' : null,
        brokerHost: host || null,
        storeName: storeRow?.store_name ?? null,
      },
    };
  } catch (e: any) {
    return {
      props: {
        redirect: null,
        error: e?.message || 'Unknown error',
        auto: auto === '1' ? '1' : null,
        brokerHost: host || null,
        storeName: null,
      },
    };
  }
};

export default function RecoveryBridgePage(props: Props) {
  const [target, setTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!props.redirect) return;
    try {
      const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
      const dest = props.redirect + hash;
      setTarget(dest);
      if (props.auto === '1' && typeof window !== 'undefined') {
        const onBrokerHost = props.brokerHost ? window.location.host === props.brokerHost : true;
        if (onBrokerHost) {
          window.location.replace(dest);
        }
      }
    } catch {
      // ignore
    }
  }, [props.redirect, props.auto, props.brokerHost]);

  return (
    <>
      <Head><title>Password Recovery</title></Head>
      {props.error ? (
        <main style={{ padding: 24 }}>
          <h1>Recovery paused</h1>
          <p>This store has no allowed domain configured yet. Ask the store owner to set <code>live_domain</code> or <code>store_domain</code>.</p>
        </main>
      ) : (
        <main style={{ padding: 24, maxWidth: 480, margin: '64px auto', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', border: '1px solid #e5e5e5', borderRadius: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Continue to reset</h1>
          <p style={{ marginBottom: 16, opacity: 0.8 }}>We’ll take you to the secure reset page to set a new password.</p>
          <p>
            {target ? (
              <a href={target} style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 8, border: '1px solid #d0d0d0', textDecoration: 'none' }}>
                {`Continue to reset on ${props.storeName || 'this store'}`}
              </a>
            ) : 'Preparing…'}
          </p>
          {props.redirect && (
            <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
              If the button doesn’t work, copy & paste this: {props.redirect}
            </p>
          )}
        </main>
      )}
    </>
  );
}

