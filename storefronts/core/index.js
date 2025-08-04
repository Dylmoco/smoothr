import { supabase } from '../../shared/supabase/browserClient';

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

// Dynamically import modules that rely on SMOOTHR_CONFIG
const [
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
  authModule,
  stripeGateway,
  liveRates,
  addToCart,
  renderCartModule,
  webflowDom,
  cmsCurrencyModule
] = await Promise.all([
  import('./abandoned-cart/index.js'),
  import('./affiliates/index.js'),
  import('./analytics/index.js'),
  import('./currency/index.js'),
  import('./dashboard/index.js'),
  import('./discounts/index.js'),
  import('./cart.js'),
  import('./orders/index.js'),
  import('./returns/index.js'),
  import('./reviews/index.js'),
  import('./subscriptions/index.js'),
  import('./auth/index.js'),
  import('../checkout/gateways/stripe.js'),
  import('./currency/live-rates.js'),
  import('./cart/addToCart.js'),
  import('./cart/renderCart.js'),
  import('../platforms/webflow/webflow-dom.js'),
  import('./currency/cms-currency.js')
]);

const auth = authModule.default || authModule;
const { fetchExchangeRates } = liveRates;
const { initCartBindings } = addToCart;
const { renderCart } = renderCartModule;
const { setSelectedCurrency: setDomCurrency } = webflowDom;
const { setSelectedCurrency: setCmsCurrency } = cmsCurrencyModule;

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
  if (typeof globalThis.setSelectedCurrency !== 'function') {
    globalThis.setSelectedCurrency = () => {};
  }

  const storeId = window.SMOOTHR_CONFIG.storeId;

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
    window.smoothr = window.smoothr || {};
    window.smoothr.auth = auth;
    window.smoothr.supabase = supabase;

    // Optional helpers for DevTools
    window.smoothr.getSession = () => supabase.auth.getSession();
    window.smoothr.getUser = () => supabase.auth.getUser();

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

    auth.initAuth().then(() => {
      if (window.smoothr?.auth?.user?.value) {
        orders.renderOrders();
      }
    });

    globalThis.setSelectedCurrency = globalThis.setSelectedCurrency || setSelectedCurrency;
  }
})();
