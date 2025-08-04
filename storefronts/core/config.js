import { createClient } from '@supabase/supabase-js';

const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
const warn = (...args) => debug && console.warn('[Smoothr Config]', ...args);

const anonClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storageKey: 'anon-config-client'
  }
};

let anonClient = null;

function getAnonClient() {
  const globalKey = `__supabaseAuthClient${anonClientOptions.auth.storageKey}`;
  if (!anonClient) {
    anonClient = (globalThis)[globalKey] || null;
    if (!anonClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      anonClient = createClient(url, anonKey, anonClientOptions);
      globalThis[globalKey] = anonClient;
    }
  }
  return anonClient;
}

export async function loadPublicConfig(storeId) {
  if (!storeId) return null;
  try {
    const client = getAnonClient();
    const { data, error } = await client
      .from('public_store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return null;
    }
    return data || null;
  } catch (e) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}
