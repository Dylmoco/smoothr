import { createClient } from '@supabase/supabase-js';

const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
const warn = (...args: any[]) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId: string) {
  if (!storeId) return null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(url, anonKey, {
      auth: { storageKey: 'smoothr-public', persistSession: false }
    });
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
  } catch (e: any) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}
