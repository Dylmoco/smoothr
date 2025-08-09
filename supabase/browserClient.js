import { createClient } from '@supabase/supabase-js';

const storageKey = 'smoothr-browser-client';
const globalKey = `__supabaseAuthClient${storageKey}`;

const globalScope = typeof window !== 'undefined' ? window : globalThis;
const debug = (globalScope.SMOOTHR_CONFIG || {}).debug;

const supabase =
  globalThis[globalKey] ||
  (globalThis[globalKey] = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ));

async function ensureSupabaseSessionAuth() {
  try {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;

    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    } else if (debug && !access_token && !refresh_token) {
      console.warn('[Smoothr] Missing access or refresh token — skipping session restore');
    }
  } catch {
    // ignore errors
  }
}

export { supabase, ensureSupabaseSessionAuth };
export default supabase;
