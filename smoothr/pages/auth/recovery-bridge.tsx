import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';

interface Props {
  storeId: string | null;
  orig: string | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const storeId = Array.isArray(query.store_id) ? query.store_id[0] : (query.store_id as string) || '';
  const orig = Array.isArray(query.orig) ? query.orig[0] : (query.orig as string) || null;
  if (!storeId) return { props: { storeId: null, orig: orig || null } };
  return { props: { storeId, orig: orig || null } };
};

export default function RecoveryBridge({ orig }: Props) {
  React.useEffect(() => {
    try {
      const hash = window.location.hash || '';
      if (!hash.includes('access_token')) return;
      if (orig) {
        const dest = `${orig.replace(/\/$/, '')}/reset-password${hash}`;
        window.location.replace(dest);
      }
    } catch {}
  }, [orig]);

  const hasToken = typeof window !== 'undefined' ? /access_token=/.test(window.location.hash) : true;

  return (
    <>
      <Head><title>Password Recovery</title></Head>
      <main style={{ padding: 24 }}>
        {!hasToken ? (
          <p>Recovery link is missing or expired.</p>
        ) : orig ? (
          <p>Forwarding…</p>
        ) : (
          <p>You may now return to your store.</p>
        )}
      </main>
    </>
  );
}
