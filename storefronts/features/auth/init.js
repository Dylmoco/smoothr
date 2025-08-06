import {
  supabase as authClient,
  ensureSupabaseSessionAuth
} from '../../../supabase/supabaseClient.js';
import * as authExports from './index.js';
import { loadPublicConfig } from '../config/sdkConfig.ts';
import * as currency from '../currency/index.js';

const authModule = authExports.default || authExports;
let authInit = () => {};
if (Object.prototype.hasOwnProperty.call(authExports, 'init')) {
  authInit = authExports.init;
}

let initialized = false;

export async function loadConfig(storeId) {
  console.log('[Smoothr SDK] loadConfig called with storeId:', storeId);
  try {
    let record;
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      const { data, error } = await authClient
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

async function domReady() {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
}

export async function init(config = {}) {
  if (initialized) return window.Smoothr?.auth;

  const script =
    typeof document !== 'undefined'
      ? document.currentScript || document.getElementById('smoothr-sdk')
      : null;
  const storeId =
    config.storeId || script?.getAttribute?.('data-store-id') || script?.dataset?.storeId;

  if (typeof window !== 'undefined') {
    window.SMOOTHR_CONFIG = {
      ...(window.SMOOTHR_CONFIG || {}),
      ...config,
      storeId
    };
  }

  if (!storeId) {
    console.warn(
      '[Smoothr SDK] No storeId found — auth metadata will be incomplete'
    );
  }

  if (
    typeof window !== 'undefined' &&
    window.location?.hash?.includes('access_token')
  ) {
    const { error } = await authClient.auth.getSessionFromUrl({
      storeSession: true
    });
    if (error) {
      console.warn('[Smoothr SDK] Error parsing session from URL:', error);
    }
  }

  await ensureSupabaseSessionAuth();

  try {
    await loadConfig(storeId || '00000000-0000-0000-0000-000000000000');
  } catch (err) {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'test'
    ) {
      console.log('[Smoothr SDK] Test environment: Ignoring error:', err.message);
    } else {
      console.warn(
        '[Smoothr SDK] Failed to load config:',
        err?.message || err
      );
    }
  }

  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.baseCurrency) currency.setBaseCurrency(cfg.baseCurrency);
  if (cfg.rates) currency.updateRates(cfg.rates);

  await domReady();

  await authInit(config);

  const authAPI = {
    login: authModule.login,
    signup: authModule.signup,
    logout: authModule.logout || authModule.signOut,
    getSession: authModule.getSession || (() => authClient.auth.getSession())
  };

  if (typeof window !== 'undefined') {
    window.Smoothr = window.Smoothr || {};
    window.Smoothr.auth = authAPI;
    window.smoothr = window.smoothr || window.Smoothr;
    window.smoothr.auth = authAPI;
    window.smoothr.supabaseAuth = authClient;
    window.supabaseAuth = authClient;
  }

  initialized = true;
  return authAPI;
}

export const SMOOTHR_CONFIG =
  (typeof window !== 'undefined' && window.SMOOTHR_CONFIG) || {};

