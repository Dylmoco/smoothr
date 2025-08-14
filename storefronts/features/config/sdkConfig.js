import { getConfig } from './globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const log = (...args) => debug && console.log('[Smoothr Config]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId, client) {
  if (!storeId || !client) return null;

  try {
    const response = await client
      .from('v_public_store')
      .select(
        'store_id,active_payment_gateway,publishable_key,base_currency,public_settings'
      )
      .eq('store_id', storeId)
      .maybeSingle();

    if (response.error || !response.data) {
      warn('Store settings lookup failed:', {
        status: response.error?.status,
        code: response.error?.code,
        message: response.error?.message,
        data: response.data,
      });
      return { public_settings: {}, active_payment_gateway: null };
    }

    const data = response.data;
    const settings = {
      ...data,
      public_settings: data.public_settings || {},
      active_payment_gateway: data.active_payment_gateway ?? null,
    };

    log('Config fetched');
    return settings;
  } catch (e) {
    warn('Store settings fetch error:', {
      status: e?.status,
      code: e?.code,
      message: e?.message || e,
      data: e?.response?.data,
    });
    return { public_settings: {}, active_payment_gateway: null };
  }
}
