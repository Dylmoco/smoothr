import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { resolveRecoveryDestination } from '../../../shared/auth/resolveRecoveryDestination';

interface Props {
  redirect?: string | null;
  error?: string | null; // 'NO_ALLOWED_ORIGIN' | message
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const storeId = Array.isArray(query.store_id) ? query.store_id[0] : (query.store_id as string) || '';
  if (!storeId) {
    return { props: { redirect: null, error: 'Missing store_id' } };
  }
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1) Fetch domains from stores
    const { data: storeRow } = await supabaseAdmin
      .from('stores')
      .select('store_domain, live_domain')
      .eq('id', storeId)
      .single();

    // 2) Fetch sign_in_redirect_url like session-sync:
    //    session-sync.ts queries v_public_store first, then falls back to public_store_settings.
    let signInRedirectUrl: string | null = null;
    const { data: vps } = await supabaseAdmin
      .from('v_public_store')
      .select('sign_in_redirect_url')
      .eq('store_id', storeId)
      .maybeSingle();
    if (vps?.sign_in_redirect_url) {
      signInRedirectUrl = vps.sign_in_redirect_url as string;
    } else {
      const { data: pss } = await supabaseAdmin
        .from('public_store_settings')
        .select('sign_in_redirect_url')
        .eq('store_id', storeId)
        .maybeSingle();
      signInRedirectUrl = (pss?.sign_in_redirect_url as string) ?? null;
    }

    // 3) Resolve destination using allowlist logic
    const orig = Array.isArray(query.orig) ? query.orig[0] : (query.orig as string) || null;
    const res = resolveRecoveryDestination({
      liveDomain: storeRow?.live_domain ?? null,
      storeDomain: storeRow?.store_domain ?? null,
      signInRedirectUrl,
      orig,
      nodeEnv: process.env.NODE_ENV,
    });

    if (res.type === 'ok') {
      const dest = new URL('/reset-password', res.origin); // no store_id in destination
      return { props: { redirect: dest.toString(), error: null } };
    }

    return { props: { redirect: null, error: 'NO_ALLOWED_ORIGIN' } };
  } catch (e: any) {
    return { props: { redirect: null, error: e?.message || 'Unknown error' } };
  }
};

export default function RecoveryBridgePage(props: Props) {
  // Client-side redirect to preserve hash: append window.location.hash to destination
  React.useEffect(() => {
    if (!props.redirect) return;
    try {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info('[Smoothr][recovery-bridge] forwarding to', props.redirect);
      }
      const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
      const target = props.redirect + hash;
      window.location.replace(target);
    } catch {
      // ignore; fall through to fallback link
    }
  }, [props.redirect]);

  return (
    <>
      <Head><title>Password Recovery</title></Head>
      {/* Redirect happens client-side to preserve the hash. On error, show minimal guidance. */}
      {props.error ? (
        <main style={{ padding: 24 }}>
          <h1>Recovery paused</h1>
          <p>
            This store has no allowed domain configured yet. Ask the store owner to set{' '}
            <code>live_domain</code> or <code>store_domain</code>, or a{' '}
            <code>sign_in_redirect_url</code>.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <details style={{ marginTop: 12 }}>
              <summary>Developer diagnostics</summary>
              <ul>
                <li>
                  Incoming <code>store_id</code> and <code>orig</code> are read by the bridge.
                </li>
                <li>
                  Allowed sources (in order): <code>live_domain</code> → <code>store_domain</code>{' '}
                  → origin of <code>sign_in_redirect_url</code>.
                </li>
                <li>
                  Dev-only: <code>orig</code> with <code>localhost/127.0.0.1</code> is permitted.
                </li>
              </ul>
            </details>
          )}
        </main>
      ) : (
        <main style={{ padding: 24 }}>
          <p>Forwarding you to the reset page…</p>
          {props.redirect && (
            <p>
              If you’re not redirected automatically, <a href={props.redirect}>click here</a>.
              {/* The anchor cannot include the hash (not available server-side), but the effect above handles it. */}
            </p>
          )}
        </main>
      )}
    </>
  );
}

