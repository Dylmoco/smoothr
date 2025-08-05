import {
  supabase as authClient,
  ensureSupabaseSessionAuth
} from '../../../supabase/supabaseClient.js';
import authModule from '../../features/auth/index.js';
import { loadPublicConfig } from '../config/sdkConfig.ts';
import {
  lookupRedirectUrl,
  lookupDashboardHomeUrl
} from '../../../supabase/authHelpers.js';
import * as currency from '../../features/currency/index.js';

const supabase = authClient;
if (typeof window !== 'undefined') {
  window.supabaseAuth = authClient;
}

if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

const storeRedirects = { lookupRedirectUrl, lookupDashboardHomeUrl };

const script = document.currentScript || document.getElementById('smoothr-sdk');
const storeId =
  script?.getAttribute?.('data-store-id') || script?.dataset?.storeId;
window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
window.SMOOTHR_CONFIG.storeId = storeId;
if (!storeId)
  console.warn(
    '[Smoothr SDK] No storeId found — auth metadata will be incomplete'
  );

const SMOOTHR_CONFIG = window.SMOOTHR_CONFIG;

const auth = authModule?.default || authModule;

  export async function loadConfig(storeId) {
  console.log('[Smoothr SDK] loadConfig called with storeId:', storeId);
  try {
    let record;
    if (
      typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
    ) {
      const { data, error } = await supabase
        .from('public_store_settings')
        .select('*')
        .eq('store_id', storeId)
        .single();
      if (error) throw error;
      record = data ?? {};
    } else {
      record = (await loadPublicConfig(storeId)) ?? {};
    }
    console.debug('[Smoothr Config] Loaded config:', record);
    if (record.active_payment_gateway == null) {
      console.debug(
        '[Smoothr Config] active_payment_gateway is null or undefined (empty settings or RLS issue)'
      );
    }
    for (const [key, value] of Object.entries(record)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      window.SMOOTHR_CONFIG[camelKey] = value;
    }
    window.SMOOTHR_CONFIG.storeId = storeId;
    console.log('[Smoothr SDK] SMOOTHR_CONFIG updated:', window.SMOOTHR_CONFIG);
  } catch (error) {
    console.warn(
      '[Smoothr SDK] Failed to load config:',
      error?.message || error
    );
    window.SMOOTHR_CONFIG = {
      ...(window.SMOOTHR_CONFIG || {}),
      storeId
    };
  }
}

  export { auth, storeRedirects, SMOOTHR_CONFIG, currency };

const Smoothr = { auth, loadConfig, storeRedirects, currency, SMOOTHR_CONFIG };
export default Smoothr;

(async function initAuthBundle() {
  if (
    typeof window !== 'undefined' &&
    window.location?.hash?.includes('access_token')
  ) {
    const { error } = await supabase.auth.getSessionFromUrl({
      storeSession: true
    });
    if (error) {
      console.warn('[Smoothr SDK] Error parsing session from URL:', error);
    }
  }

    await ensureSupabaseSessionAuth();

    try {
      await loadConfig(
        storeId || '00000000-0000-0000-0000-000000000000'
      );
  } catch (err) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      console.log('[Smoothr SDK] Test environment: Ignoring error:', err.message);
    } else {
      console.warn(
        '[Smoothr SDK] Failed to load config:',
        err?.message || err
      );
    }
  }

  const cfg = window.SMOOTHR_CONFIG;
  if (cfg.baseCurrency) currency.setBaseCurrency(cfg.baseCurrency);
  if (cfg.rates) currency.updateRates(cfg.rates);

  if (typeof window !== 'undefined') {
    window.Smoothr = Smoothr;
    window.smoothr = window.smoothr || {};
    window.smoothr.auth = auth;
    window.smoothr.supabaseAuth = authClient;
  }
})();
