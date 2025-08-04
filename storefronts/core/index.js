import * as supabaseClient from '../../shared/supabase/browserClient';
const { supabase, ensureSupabaseSessionAuth } = supabaseClient;

// expose for debugging
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

import { getAnonClient } from './config.ts';

const anonClient = getAnonClient();

import * as abandonedCart from './abandoned-cart/index.js';
import * as affiliates from './affiliates/index.js';
import * as analytics from './analytics/index.js';
import * as currency from './currency/index.js';
import * as dashboard from './dashboard/index.js';
import * as discounts from './discounts/index.js';
import * as cart from './cart.js';
import * as orders from './orders/index.js';
import * as returns from './returns/index.js';
import * as reviews from './reviews/index.js';
import * as subscriptions from './subscriptions/index.js';
import authModule from './auth/index.js';
import stripeGateway from '../checkout/gateways/stripe.js';
import { fetchExchangeRates } from './currency/live-rates.js';
import { initCartBindings } from './cart/addToCart.js';
import { renderCart } from './cart/renderCart.js';
import { setSelectedCurrency as setDomCurrency } from '../platforms/webflow/webflow-dom.js';
import { setSelectedCurrency as setCmsCurrency } from './currency/cms-currency.js';

// Capture the store ID as soon as the bundle loads
const script = document.currentScript || document.getElementById('smoothr-sdk');
const storeId = script?.getAttribute?.('data-store-id') || script?.dataset?.storeId;
window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
window.SMOOTHR_CONFIG.storeId = storeId;
console.log('[Smoothr SDK] Initialized storeId:', storeId);
if (!storeId)
  console.warn(
    '[Smoothr SDK] No storeId found — auth metadata will be incomplete'
  );

const auth = authModule?.default || authModule;

// Load config from public_store_settings into window.SMOOTHR_CONFIG
export async function loadConfig(storeId) {
  console.log('[Smoothr SDK] loadConfig called with storeId:', storeId);
  try {
    const client =
      typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
        ? supabase
        : anonClient;
    const { data, error } = await client
      .from('public_store_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();
    if (error) throw error;
    const record = data ?? {};
    for (const [key, value] of Object.entries(record)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      window.SMOOTHR_CONFIG[camelKey] = value;
    }
    window.SMOOTHR_CONFIG.storeId = storeId;
    console.log('[Smoothr SDK] SMOOTHR_CONFIG updated:', window.SMOOTHR_CONFIG);
  } catch (error) {
    console.warn('[Smoothr SDK] Failed to load config:', error?.message || error);
    window.SMOOTHR_CONFIG = {
      ...(window.SMOOTHR_CONFIG || {}),
      storeId
    };
  }
}

// Default rate source (fallback)
const DEFAULT_RATE_SOURCE =
  (typeof process !== 'undefined' && process.env.LIVE_RATES_URL) ||
  'https://lpuqrzvokroazwlricgn.functions.supabase.co/proxy-live-rates';

// Export modules
export {
  abandonedCart,
  affiliates,
  analytics,
  currency,
  dashboard,
  discounts,
  cart,
  orders,
  returns,
  reviews,
  subscriptions,
  auth,
  stripeGateway as checkout
};

const Smoothr = {
  abandonedCart,
  affiliates,
  analytics,
  currency,
  dashboard,
  discounts,
  cart,
  orders,
  returns,
  reviews,
  subscriptions,
  auth,
  checkout: stripeGateway
};

export default Smoothr;

// Bootstrap SDK: load config and then initialize everything
(async function initSmoothr() {
  if (
    typeof window !== 'undefined' &&
    window.location?.hash?.includes('access_token')
  ) {
    const { data, error } = await supabase.auth.getSessionFromUrl({
      storeSession: true
    });
    if (error) {
      console.warn('[Smoothr] Error parsing session from URL:', error);
    }
  }

  await ensureSupabaseSessionAuth();

  if (supabase.auth?.onAuthStateChange) {
    supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Smoothr] Auth state changed, new session:', session);
    });
  }

  if (typeof globalThis.setSelectedCurrency !== 'function') {
    globalThis.setSelectedCurrency = () => {};
  }

  const storeId = window.SMOOTHR_CONFIG.storeId;

  console.log('[Smoothr SDK] Bootstrap triggered', { storeId });

  if (!storeId && process.env.NODE_ENV !== 'test') {
    throw new Error('Missing data-store-id on <script> tag');
  }

  try {
    await loadConfig(storeId || '00000000-0000-0000-0000-000000000000');
  } catch (err) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      console.log('[Smoothr SDK] Test environment: Ignoring error:', err.message);
    } else {
      console.warn('[Smoothr SDK] Bootstrap failed:', err?.message || err);
    }
  }

  const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr SDK]', ...args);

  log('Smoothr SDK loaded');

  let setSelectedCurrency = setDomCurrency;

  if (typeof window !== 'undefined') {
    const cfg = window.SMOOTHR_CONFIG;
    const isFeatureEnabled = name => cfg?.features?.[name] !== false;

    // Inject card styles
    if (
      typeof document !== 'undefined' &&
      typeof document.createElement === 'function' &&
      !document.querySelector('#smoothr-card-styles')
    ) {
      const style = document.createElement('style');
      style.id = 'smoothr-card-styles';
      style.textContent =
        '[data-smoothr-card-number],\n[data-smoothr-card-expiry],\n[data-smoothr-card-cvc]{display:block;position:relative;}\niframe[data-accept-id]{display:block!important;}';
      document.head.appendChild(style);
    }

    // Currency setup
    if (cfg.baseCurrency) currency.setBaseCurrency(cfg.baseCurrency);
    if (cfg.rates) currency.updateRates(cfg.rates);

    const base = cfg.baseCurrency || currency.baseCurrency;
    const symbols = cfg.rates ? Object.keys(cfg.rates) : Object.keys(currency.rates);
    const urlBase = cfg.rateSource || DEFAULT_RATE_SOURCE;

    if (cfg.debug) {
      let debugUrl = urlBase;
      if (!/[?&]base=/.test(debugUrl)) {
        debugUrl += (debugUrl.includes('?') ? '&' : '?') + `base=${encodeURIComponent(base)}`;
      }
      if (!/[?&]symbols=/.test(debugUrl)) {
        debugUrl += (debugUrl.includes('?') ? '&' : '?') + `symbols=${symbols.join(',')}`;
      }
      log('smoothr:live-rates-url', debugUrl);
    }

    if (typeof fetchExchangeRates === 'function') {
      fetchExchangeRates(base, symbols, cfg.rateSource || urlBase)
        .then(rates => {
          if (rates) {
            currency.updateRates(rates);
            if (cfg.debug) log('smoothr:live-rates', rates);
          }
        })
        .catch(() => {});
    } else {
      console.warn('[Smoothr SDK] fetchExchangeRates is not available');
    }

    if (cfg.platform === 'cms') {
      setSelectedCurrency = setCmsCurrency;
    }

    if (isFeatureEnabled('abandonedCart')) {
      try {
        if (typeof abandonedCart.setupAbandonedCartTracker === 'function') {
          abandonedCart.setupAbandonedCartTracker({ debug: cfg.debug });
        }
      } catch {}
    }

    window.Smoothr = Smoothr;
    window.smoothr = window.smoothr || {};
    window.smoothr.auth = auth;
    window.smoothr.supabase = supabase;
    // Optional helpers for DevTools
    if (supabase.auth) {
      window.smoothr.getSession = () => supabase.auth.getSession();
      window.smoothr.getUser = () => supabase.auth.getUser();
    }

    if (isFeatureEnabled('cart')) {
      window.renderCart = renderCart;
      log('🎨 renderCart registered in SDK');

      window.Smoothr.cart = { ...cart, ...(window.Smoothr.cart || {}) };
      window.Smoothr.cart.renderCart = renderCart;
      window.Smoothr.checkout = stripeGateway;
      window.initCartBindings = initCartBindings;

      document.addEventListener('DOMContentLoaded', () => {
        log('✅ DOM ready – calling initCartBindings');
        if (typeof initCartBindings === 'function') {
          initCartBindings();
        } else {
          console.warn('[Smoothr SDK] initCartBindings is not available');
        }
      });
    }

    if (isFeatureEnabled('auth') && auth?.initAuth) {
      auth.initAuth().then(() => {
        if (window.smoothr?.auth?.user?.value && orders?.renderOrders) {
          orders.renderOrders();
        }
      });
    } else if (!auth?.initAuth) {
      console.warn('[Smoothr SDK] auth.initAuth is not available');
    }

    globalThis.setSelectedCurrency = globalThis.setSelectedCurrency || setSelectedCurrency;
  }
})();
