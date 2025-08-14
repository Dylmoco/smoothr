import {
  supabase as importedSupabase,
  ensureSupabaseSessionAuth
} from '../../../supabase/browserClient.js';
import * as authExports from './index.js';
import * as currency from '../currency/index.js';
import { getConfig, mergeConfig } from '../config/globalConfig.js';

// Legacy helpers
const { lookupRedirectUrl, lookupDashboardHomeUrl } = authExports;
export const storeRedirects = { lookupRedirectUrl, lookupDashboardHomeUrl };

// Some build environments reference a minified global `Cc` for the Supabase
// client. Fall back to the imported client if the global is unavailable.
const authClient = globalThis.Cc || importedSupabase;

if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {};
  window.Smoothr.storeRedirects = storeRedirects;
  window.smoothr = window.smoothr || window.Smoothr;
  window.smoothr.storeRedirects = storeRedirects;
}

const authModule = authExports.default || authExports;
let authInit = () => {};
if (Object.prototype.hasOwnProperty.call(authExports, 'init')) {
  authInit = authExports.init;
}

let initialized = false;

export async function loadConfig(storeId) {
  console.log('[Smoothr SDK] loadConfig called with storeId:', storeId);
  try {
    const { data, error } = await authClient
      .from('v_public_store')
      .select(
        'store_id, active_payment_gateway, publishable_key, base_currency'
      )
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) throw error;
    const record = data ?? {};
    console.debug('[Smoothr Config] Loaded config:', record);
    if (record.active_payment_gateway == null) {
      console.debug(
        '[Smoothr Config] active_payment_gateway is null or undefined (empty settings or RLS issue)'
      );
    }
    const updates = {};
    for (const [key, value] of Object.entries(record)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      updates[camelKey] = value;
    }
    updates.storeId = storeId;
    mergeConfig(updates);
    console.log('[Smoothr SDK] SMOOTHR_CONFIG updated:', getConfig());
  } catch (error) {
    console.warn(
      '[Smoothr SDK] Failed to load config:',
      error?.message || error
    );
    mergeConfig({ storeId });
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

let sessionReadyPromise;
export function waitForSessionReady() {
  if (sessionReadyPromise) return sessionReadyPromise;
  sessionReadyPromise = (async () => {
    await ensureSupabaseSessionAuth();
    try {
      const {
        data: { session }
      } = await authClient.auth.getSession();
      if (!session) {
        let hasGhostTokens = false;
        try {
          const raw = authClient.auth.storage?.getItem?.(
            authClient.auth.storageKey
          );
          if (raw) {
            const parsed = JSON.parse(raw);
            const tokenHolder = parsed?.currentSession || parsed;
            hasGhostTokens = Boolean(
              tokenHolder?.access_token || tokenHolder?.refresh_token
            );
          }
        } catch {
          // ignore JSON/storage errors
        }
        if (hasGhostTokens) {
          console.warn(
            '[Smoothr] Detected ghost session — clearing broken Supabase state'
          );
          try {
            await authClient.auth.signOut({ scope: 'local' });
          } catch {
            // ignore signOut errors
          }
        }
      } else {
        console.log('[Smoothr] Auth restored');
      }
    } catch {
      // ignore session check errors
    }
  })();
  return sessionReadyPromise;
}

export async function init(config = {}) {
  if (initialized) return window.Smoothr?.auth;
  if (!authClient) {
    console.warn('[Smoothr SDK] Supabase client unavailable - skipping auth init');
    return {};
  }

  try {
    const script =
      typeof document !== 'undefined'
        ? document.currentScript || document.getElementById('smoothr-sdk')
        : null;
    const storeId =
      config.storeId || script?.getAttribute?.('data-store-id') || script?.dataset?.storeId;

    mergeConfig({ ...config, storeId });

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

    await waitForSessionReady();

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

    const cfg = getConfig();
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
  } catch (error) {
    console.warn('[Smoothr SDK] Auth initialization failed', error);
    return {
      login: authModule.login,
      signup: authModule.signup,
      logout: authModule.logout || authModule.signOut,
      getSession: authModule.getSession || (() => authClient.auth.getSession())
    };
  }
}

export const SMOOTHR_CONFIG = getConfig();

