import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function loadConfig(storeId) {
  const { data, error } = await supabase
    .from('store_settings')
    .select('settings')
    .eq('store_id', storeId)
    .single();
  if (error) throw error;
  window.SMOOTHR_CONFIG = data.settings;
  // ensure storeId is always available
  window.SMOOTHR_CONFIG.storeId = storeId;
}

(async () => {
  try {
    await loadConfig(STORE_ID_TOKEN);
  } catch (err) {
    // only rethrow in test mode if process exists and NODE_ENV !== 'test'
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      throw err;
    }
    // otherwise swallow (browser or test mode)
  }
  

  const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr SDK]', ...args);

  log('Smoothr SDK loaded');

  let setSelectedCurrency = setDomCurrency;

if (typeof window !== 'undefined') {
  const cfg = window.SMOOTHR_CONFIG;
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
  if (cfg.baseCurrency) {
    currency.setBaseCurrency(cfg.baseCurrency);
  }
  if (cfg.rates) {
    currency.updateRates(cfg.rates);
  }
  const base = cfg.baseCurrency || currency.baseCurrency;
  const symbols = cfg.rates ? Object.keys(cfg.rates) : Object.keys(currency.rates);
  const urlBase = cfg.rateSource || DEFAULT_RATE_SOURCE;
  if (cfg.debug) {
    let debugUrl = urlBase;
    if (!/[?&]base=/.test(urlBase)) {
      debugUrl += (debugUrl.includes('?') ? '&' : '?') + `base=${encodeURIComponent(base)}`;
    }
    if (!/[?&]symbols=/.test(urlBase)) {
      debugUrl += (debugUrl.includes('?') ? '&' : '?') + `symbols=${symbols.join(',')}`;
    }
    log('smoothr:live-rates-url', debugUrl);
  }
  fetchExchangeRates(base, symbols, cfg.rateSource)
    .then(rates => {
      if (rates) {
        currency.updateRates(rates);
        if (cfg.debug) {
          log('smoothr:live-rates', rates);
        }
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
  window.Smoothr = window.Smoothr || {};
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
}

  globalThis.setSelectedCurrency =
    globalThis.setSelectedCurrency || setSelectedCurrency;
})();

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

const DEFAULT_RATE_SOURCE =
  'https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP';

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
