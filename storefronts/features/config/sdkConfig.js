import supabase from '../../../supabase/browserClient.js';
import { getConfig } from './globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const log = (...args) => debug && console.log('[Smoothr Config]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId) {
  if (!storeId) return null;

  try {
    const { data, error } = await supabase
      .from('v_public_store')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();

    if (error) {
      warn('Store settings lookup failed:', error.message);
      return null;
    }

    log('Config fetched');
    return data || null;
  } catch (e) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}
