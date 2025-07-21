import supabase from '../../supabase/supabaseClient.js';

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
import * as auth from './auth/index.js';
import * as stripeGateway from '../checkout/gateways/stripe.js';

import { fetchExchangeRates } from './currency/live-rates.js';
import { initCartBindings } from './cart/addToCart.js';
import { renderCart } from './cart/renderCart.js';
import { setSelectedCurrency as setDomCurrency } from '../platforms/webflow/webflow-dom.js';
import { setSelectedCurrency as setCmsCurrency } from './currency/cms-currency.js';

// Load config from public_store_settings into window.SMOOTHR_CONFIG
async function loadConfig(storeId) {
  const { data, error } = await supabase
    .from('public_store_settings')
    .select('*')
    .eq('store_id', storeId)
    .single();
  if (error) throw error;
  window.SMOOTHR_CONFIG = {
    ...(window.SMOOTHR_CONFIG || {}),
    ...(data || {})
  };
  if (
    'api_base' in window.SMOOTHR_CONFIG &&
    !window.SMOOTHR_CONFIG.apiBase
  ) {
    window.SMOOTHR_CONFIG.apiBase = window.SMOOTHR_CONFIG.api_base;
  }
  window.SMOOTHR_CONFIG.storeId = storeId;
}

// Default rate source (fallback)
const DEFAULT_RATE_SOURCE =
  'https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP';

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
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="smoothr-sdk"][data-store-id]');

  const storeId = currentScript?.dataset?.storeId;

  console.log('[Smoothr SDK] Bootstrap triggered', { storeId });

  if (!storeId) throw new Error('Missing data-store-id on <script> tag');

  try {
    await loadConfig(storeId);
  } catch (err) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      // noop
    } else {
      throw err;
    }
  }

  const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr SDK]', ...args);

  log('Smoothr SDK loaded');

  let setSelectedCurrency = setDomCurrency;

  if (typeof window !== 'undefined') {
    const cfg = window.SMOOTHR_CONFIG;

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

    fetchExchangeRates(base, symbols, cfg.rateSource || urlBase)
      .then(rates => {
        if (rates) {
          currency.updateRates(rates);
          if (cfg.debug) log('smoothr:live-rates', rates);
        }
      })
      .catch(() => {});

    if (cfg.platform === 'cms') {
      setSelectedCurrency = setCmsCurrency;
    }

    window.Smoothr = Smoothr;
    window.smoothr = window.smoothr || Smoothr;
    window.renderCart = renderCart;
    log('🎨 renderCart registered in SDK');

    window.Smoothr.cart = { ...cart, ...(window.Smoothr.cart || {}) };
    window.Smoothr.cart.renderCart = renderCart;
    window.Smoothr.checkout = stripeGateway;
    window.initCartBindings = initCartBindings;

    document.addEventListener('DOMContentLoaded', () => {
      log('✅ DOM ready – calling initCartBindings');
      initCartBindings();
    });

    Promise.resolve(auth.initAuth()).then(() => {
      if (window.smoothr?.auth?.user) {
        orders.renderOrders();
      }
    });

    globalThis.setSelectedCurrency = globalThis.setSelectedCurrency || setSelectedCurrency;
  }
})();
