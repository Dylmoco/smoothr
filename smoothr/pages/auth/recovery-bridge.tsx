import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { resolveRecoveryDestination } from '../../../shared/auth/resolveRecoveryDestination';

interface Props {
  redirect?: string | null;
  error?: string | null;
  auto?: '1' | null;
  brokerHost?: string | null;
  storeName?: string | null;
  storeId?: string | null;
  requestId?: string | null;
}
function hasCode(v: unknown): v is { code: string } {
  return !!v && typeof v === 'object' && 'code' in (v as any);
}
export const getServerSideProps: GetServerSideProps<Props> = async ({ query, req }) => {
  const storeId = Array.isArray(query.store_id) ? query.store_id[0] : (query.store_id as string) || '';
  const auto = Array.isArray(query.auto) ? query.auto[0] : (query.auto as string) || null;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string);
  const requestId = (req.headers['x-request-id'] as string) || null;
  if (!storeId) {
    return {
      props: {
        redirect: null,
        error: 'Missing store_id',
        auto: auto === '1' ? '1' : null,
        brokerHost: host || null,
        storeName: null,
        storeId: null,
        requestId,
      },
    };
  }
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: storeRow } = await supabaseAdmin
      .from('v_public_store')
      .select('store_domain, live_domain, store_name, auth_reset_url')
      .eq('id', storeId)
      .single();

    const orig = Array.isArray(query.orig) ? query.orig[0] : (query.orig as string) || null;
    const res = resolveRecoveryDestination({
      liveDomain: storeRow?.live_domain ?? null,
      storeDomain: storeRow?.store_domain ?? null,
      signInRedirectUrl: null,
      orig,
      nodeEnv: process.env.NODE_ENV,
    });

    const expectedHost = (storeRow?.live_domain || storeRow?.store_domain || '').toLowerCase();
    let dest: string | null = null;

    if (storeRow?.auth_reset_url) {
      try {
        const u = new URL(storeRow.auth_reset_url);
        if (u.host.toLowerCase() === expectedHost) {
          dest = storeRow.auth_reset_url;
        } else {
          console.warn('[recovery-bridge] auth_reset_url host mismatch', {
            storeId,
            authResetUrl: storeRow.auth_reset_url,
            expectedHost,
          });
          return {
            props: {
              redirect: null,
              error: 'INVALID_RESET_URL',
              auto: auto === '1' ? '1' : null,
              brokerHost: host || null,
              storeName: storeRow?.store_name ?? null,
              storeId,
              requestId,
            },
          };
        }
      } catch {
        console.warn('[recovery-bridge] invalid auth_reset_url', {
          storeId,
          authResetUrl: storeRow?.auth_reset_url,
        });
        return {
          props: {
            redirect: null,
            error: 'INVALID_RESET_URL',
            auto: auto === '1' ? '1' : null,
            brokerHost: host || null,
            storeName: storeRow?.store_name ?? null,
            storeId,
            requestId,
          },
        };
      }
    }

    if (!dest && res.type === 'ok' && res.origin) {
      dest = `${res.origin}/auth/reset`;
    }

    if (dest) {
      console.log('[recovery-bridge] redirect', { dest, auto: auto === '1' });
      return {
        props: {
          redirect: dest,
          error: null,
          auto: auto === '1' ? '1' : null,
          brokerHost: host || null,
          storeName: storeRow?.store_name ?? null,
          storeId,
          requestId,
        },
      };
    }

    console.warn('[recovery-bridge] no destination', { storeId, orig });
    return {
      props: {
        redirect: null,
        error: hasCode(res) ? res.code : 'NO_DESTINATION',
        auto: auto === '1' ? '1' : null,
        brokerHost: host || null,
        storeName: storeRow?.store_name ?? null,
        storeId,
        requestId,
      },
    };
  } catch (e: any) {
    console.error('[recovery-bridge] error', e);
    return {
      props: {
        redirect: null,
        error: e?.message || 'Unknown error',
        auto: auto === '1' ? '1' : null,
        brokerHost: host || null,
        storeName: null,
        storeId,
        requestId,
      },
    };
  }
};

export default function RecoveryBridgePage(props: Props) {
  const [target, setTarget] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (!props.redirect) return;
    try {
      const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
      const hashParams = new URLSearchParams(hash);
      const params = new URLSearchParams({ type: 'recovery' });
      const token = hashParams.get('access_token');
      if (token) params.set('access_token', token);
      if (props.storeId) params.set('store_id', props.storeId);
      const baseHref = new URL(props.redirect).href;
      const dest = `${baseHref}#${params.toString()}`;
      setTarget(dest);
      if (
        process.env.NODE_ENV !== 'production' &&
        router.query.debug === '1'
      ) {
        // eslint-disable-next-line no-console
        console.debug('[recovery-bridge]', {
          auth_reset_url: props.redirect,
          baseHref,
          final: dest,
        });
      }
      if (props.auto === '1' && typeof window !== 'undefined') {
        const onBrokerHost = props.brokerHost ? window.location.host === props.brokerHost : true;
        if (onBrokerHost) {
          window.location.replace(dest);
        }
      }
    } catch {
      // ignore
    }
  }, [props.redirect, props.auto, props.brokerHost, props.storeId, router.query.debug]);

  return (
    <>
      <Head><title>Password Recovery</title></Head>
      {props.error ? (
        <main style={{ padding: 24 }}>
          <h1>Recovery paused</h1>
          <p>We could not determine where to send you. Ask the store owner to set a store domain or include an <code>orig</code> parameter.</p>
          {props.requestId && (
            <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>Request ID: {props.requestId}</p>
          )}
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

