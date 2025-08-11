import { mergeConfig } from './features/config/globalConfig.js';
import { loadPublicConfig } from './features/config/sdkConfig.js';
import { LOG, info, warn, groupStart, groupEnd } from './utils/logger.js';

// Ensure legacy global currency helper exists
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

const scriptEl = document.getElementById('smoothr-sdk');
const storeId = scriptEl?.dataset?.storeId || null;
const platform =
  scriptEl?.dataset?.platform || scriptEl?.getAttribute?.('platform') || null;
const debug = new URLSearchParams(window.location.search).has('smoothr-debug');

if (!scriptEl || !storeId || !platform) {
  warn(LOG.INIT_SKIPPED);
} else {
  const config = mergeConfig({ storeId, platform, debug });
  if (config.platform === 'webflow-ecom') {
    warn('[Smoothr] Invalid platform "webflow-ecom" — defaulting to "webflow"');
    config.platform = 'webflow';
  }
  const Smoothr = (window.Smoothr = window.Smoothr || {});
  window.smoothr = window.smoothr || Smoothr;
  Smoothr.config = config;

  const log = (...args) => debug && console.log('[Smoothr SDK]', ...args);
  log('Config initialized', config);

  (async () => {
    if (storeId) {
      try {
        log('Fetching store settings');
        const data = await loadPublicConfig(storeId);
        if (!data && debug) {
          warn('[Smoothr SDK] Store settings request failed');
        }
        config.settings = { ...(config.settings || {}), ...(data || {}) };
        log('Store settings loaded', config.settings);
      } catch (err) {
        debug && warn('[Smoothr SDK] Failed to fetch store settings');
      }
    }

    if (platform) {
      try {
        log(`Loading adapter: ${platform}`);
        const mod = await import(`./adapters/${platform}.js`);
        const adapter = mod.default ?? mod;
        const instance = await adapter.initAdapter?.(config);
        await instance?.domReady?.();
        log('Adapter initialized');
      } catch (err) {
        debug && warn('[Smoothr SDK] Failed to load adapter');
      }
    }

    try {
      log('Initializing auth feature');
      const auth = await import('./features/auth/init.js');
      await auth.init(config);
    } catch (err) {
      debug && warn('[Smoothr SDK] Auth init failed');
    }

    try {
      log('Initializing currency feature');
      const currency = await import('./features/currency/index.js');
      await currency.init(config);
    } catch (err) {
      debug && warn('[Smoothr SDK] Currency init failed');
    }
    const hasCheckoutTrigger = document.querySelector('[data-smoothr="pay"]');
    const hasCartTrigger =
      document.querySelector('[data-smoothr="add-to-cart"]') ||
      document.querySelector('[data-smoothr-total]') ||
      document.querySelector('[data-smoothr-cart]');

    if (hasCheckoutTrigger) {
      try {
        log('Initializing checkout feature');
        const { init } = await import('./features/checkout/init.js');
        await init(config);
        info(LOG.FEATURE_LOADED('checkout'));
      } catch (err) {
        debug && warn('[Smoothr SDK] Checkout init failed');
      }
    } else {
      log('No checkout triggers found, skipping checkout initialization');
    }

    if (hasCartTrigger) {
      try {
        log('Initializing cart feature');
        const cart = await import('./features/cart/init.js');
        await cart.init(config);
        info(LOG.FEATURE_LOADED('cart'));
      } catch (err) {
        debug && warn('[Smoothr SDK] Cart init failed');
      }
    } else {
      log('No cart triggers found, skipping cart initialization');
    }
    if (debug) {
      groupStart(LOG.DEBUG_SUMMARY_TITLE);
      groupEnd();
    }
  })();
}

