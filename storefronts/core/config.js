import supabase from './supabaseClient.js';

const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
const warn = (...args) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId) {
  if (!storeId) return null;
  try {
    const { data, error } = await supabase
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
