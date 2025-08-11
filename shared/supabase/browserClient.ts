import { createClient } from '@supabase/supabase-js';

let singleton: any;

function createMockClient() {
  const viFn = (globalThis as any).vi?.fn;
  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithOAuth: viFn
      ? viFn().mockResolvedValue({ data: {}, error: null })
      : async () => ({ data: {}, error: null }),
    signOut: viFn
      ? viFn().mockResolvedValue({ error: null })
      : async () => ({ error: null })
  };
  return {
    auth,
    from: () => ({ select: async () => ({ data: [], error: null }) })
  } as any;
}

function resolveKeys(url?: string, key?: string) {
  let resolvedUrl =
    url ||
    process.env.SUPABASE_URL ||
    (globalThis as any).SMOOthr?.supabase?.url ||
    (typeof window !== 'undefined'
      ? (window as any).SMOOthr?.config?.supabase?.url
      : undefined);
  let resolvedKey =
    key ||
    process.env.SUPABASE_ANON_KEY ||
    (globalThis as any).SMOOthr?.supabase?.key ||
    (typeof window !== 'undefined'
      ? (window as any).SMOOthr?.config?.supabase?.key
      : undefined);
  return { resolvedUrl, resolvedKey };
}

export function initClient(url?: string, anonKey?: string) {
  if (singleton) return singleton;
  const { resolvedUrl, resolvedKey } = resolveKeys(url, anonKey);
  if (!resolvedUrl || !resolvedKey) {
    if (process.env.VITEST) {
      singleton = createMockClient();
      return singleton;
    }
    throw new Error(
      '[Smoothr] Supabase client is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.'
    );
  }
  singleton = createClient(resolvedUrl, resolvedKey);
  return singleton;
}

export function getClient() {
  if (!singleton) {
    try {
      initClient();
    } catch {
      const msg =
        '[Smoothr] Supabase client is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.';
      singleton = new Proxy(
        {},
        {
          get() {
            throw new Error(msg);
          }
        }
      );
    }
  }
  return singleton;
}

export async function ensureSupabaseSessionAuth() {
  try {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
    const client = getClient();
    const {
      data: { session }
    } = await client.auth.getSession();
    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;
    if (access_token && refresh_token) {
      await client.auth.setSession({ access_token, refresh_token });
    } else {
      console.warn('[Smoothr] Missing access or refresh token — skipping session restore');
    }
  } catch {
    // ignore errors
  }
}

export const supabase = getClient();
export default supabase;
