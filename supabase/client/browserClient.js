import { createClient } from '@supabase/supabase-js';

let _supabasePromise = null;

/** Resolve/create a singleton Supabase client after loader config. */
export async function getSupabaseClient() {
  const w = typeof window !== 'undefined' ? window : globalThis;

  // If loader already created it, reuse.
  if (w.Smoothr?.__supabase) return w.Smoothr.__supabase;

  if (!_supabasePromise) {
    _supabasePromise = (async () => {
      // Preferred path: wait for loader-provided supabaseReady.
      if (w.Smoothr?.supabaseReady) {
        const c = await w.Smoothr.supabaseReady;
        if (c) return (w.Smoothr.__supabase = c);
      }

      // Fallback for tests/dev: pull from env or preloaded config.
      const cfg = (w.Smoothr && w.Smoothr.config) || {};
      const url =
        cfg.supabaseUrl ||
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL);
      const key =
        cfg.supabaseAnonKey ||
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (!url || !key) return null;

      const client = createClient(url, key, {
        auth: {
          persistSession: true,
          storageKey: `smoothr_${cfg.storeId || 'default'}`,
        },
      });
      w.Smoothr = w.Smoothr || {};
      w.Smoothr.__supabase = client;
      return client;
    })();
  }
  return _supabasePromise;
}

export async function ensureSupabaseSessionAuth() {
  try {
    const w = typeof window !== 'undefined' ? window : globalThis;
    const client = await getSupabaseClient();
    if (!client) return;

    const storage = w.localStorage;
    if (!storage?.getItem) return;

    const candidates = ['smoothr.auth.session', 'supabase.auth.token'];
    for (const key of candidates) {
      try {
        const raw = storage.getItem(key);
        if (!raw) continue;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const s = parsed?.currentSession || parsed?.session || parsed || null;
        const access_token = s?.access_token || s?.access?.token;
        const refresh_token = s?.refresh_token || s?.refresh?.token;
        if (access_token && refresh_token) {
          await client.auth.setSession({ access_token, refresh_token });
          break;
        }
      } catch {}
    }
  } catch {}
}

// Do NOT export a default client (prevents eager init).
export default undefined;
