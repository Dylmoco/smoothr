import { getConfig } from './globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const log = (...args) => debug && console.log('[Smoothr Config]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId, supabase) {
  if (!storeId || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('v_public_store')
      .select(
        'store_id,active_payment_gateway,publishable_key,base_currency,public_settings,sign_in_redirect_url,sign_out_redirect_url,oauth_popup_enabled'
      )
      .eq('store_id', storeId)
      .maybeSingle();

    const settings = {
      public_settings: {},
      active_payment_gateway: null,
      sign_in_redirect_url: null,
      sign_out_redirect_url: null,
      oauth_popup_enabled: false
    };

    if (error || !data) {
      warn('Store settings lookup failed:', {
        status: error?.status,
        code: error?.code,
        message: error?.message,
      });
    } else {
      Object.assign(settings, {
        ...data,
        public_settings: data.public_settings || {},
        active_payment_gateway: data.active_payment_gateway ?? null,
        sign_in_redirect_url: data?.sign_in_redirect_url ?? null,
        sign_out_redirect_url: data?.sign_out_redirect_url ?? null,
        oauth_popup_enabled: data?.oauth_popup_enabled ?? false
      });
    }

    if (!settings.sign_in_redirect_url || !settings.sign_out_redirect_url) {
      try {
        const { data: fb } = await supabase
          .from('public_store_settings')
          .select('sign_in_redirect_url,sign_out_redirect_url')
          .eq('store_id', storeId)
          .maybeSingle();
        if (fb) {
          if (!settings.sign_in_redirect_url)
            settings.sign_in_redirect_url = fb.sign_in_redirect_url ?? null;
          if (!settings.sign_out_redirect_url)
            settings.sign_out_redirect_url = fb.sign_out_redirect_url ?? null;
        }
      } catch {}
    }

    const cfg = getConfig();
    cfg.sign_in_redirect_url = settings.sign_in_redirect_url;
    cfg.sign_out_redirect_url = settings.sign_out_redirect_url;

    log('Config fetched');
    return settings;
  } catch (e) {
    warn('Store settings fetch error:', {
      status: e?.status,
      code: e?.code,
      message: e?.message || e,
    });
    return {
      public_settings: {},
      active_payment_gateway: null,
      sign_in_redirect_url: null,
      sign_out_redirect_url: null,
      oauth_popup_enabled: false
    };
  }
}
