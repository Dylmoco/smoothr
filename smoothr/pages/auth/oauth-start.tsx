import React from 'react';
import { createClient } from '@supabase/supabase-js';

export default function OAuthStartPage() {
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const provider = params.get('provider') || 'google';
      const store_id = params.get('store_id') || '';
      const orig = params.get('orig') || '';
      try {
        const cookieVal = encodeURIComponent(JSON.stringify({ store_id, orig }));
        document.cookie = `smoothr_oauth_ctx=${cookieVal}; Max-Age=120; Path=/; SameSite=Lax`;
      } catch {}
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const brokerOrigin =
        process.env.NEXT_PUBLIC_BROKER_ORIGIN ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        window.location.origin;
      supabase.auth.signInWithOAuth({
        provider: provider === 'apple' ? 'apple' : 'google',
        options: { redirectTo: `${brokerOrigin}/auth/callback` }
      });
    } catch {}
  }, []);
  return (
    <main style={{ padding: 24 }}>
      <p>Redirecting to Google…</p>
    </main>
  );
}
