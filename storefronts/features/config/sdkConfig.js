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
      .select('store_id,active_payment_gateway,publishable_key,base_currency')
      .eq('store_id', storeId)
      .maybeSingle();

    if (error) {
      warn('Store settings lookup failed:', {
        status: error.status,
        message: error.message,
      });
      return null;
    }

    log('Config fetched');
    return data || null;
  } catch (e) {
    warn('Store settings fetch error:', {
      status: e?.status,
      message: e?.message || e,
    });
    return null;
  }
}
