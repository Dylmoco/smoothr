import { createClient } from '@supabase/supabase-js';
import { getConfig } from './globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const warn = (...args: any[]) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId: string) {
  if (!storeId) return null;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        // unique key to avoid collisions with primary client storage
        storageKey: 'smoothr-anon-client',
      },
    }
  );

  try {
    const { data, error } = await client
      .from('public_store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return null;
    }

    if (debug) {
      console.log('[Smoothr SDK] Config fetched anonymously');
    }

    return data || null;
  } catch (e: any) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}
