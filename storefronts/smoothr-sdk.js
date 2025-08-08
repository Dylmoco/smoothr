import { mergeConfig } from './features/config/globalConfig.js';
import { loadPublicConfig } from './features/config/sdkConfig.ts';
import { waitForSessionReady } from './features/auth/init.js';

// Ensure legacy global currency helper exists
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

const scriptEl = document.getElementById('smoothr-sdk');
const storeId = scriptEl?.dataset?.storeId || null;
const platform =
  scriptEl?.dataset?.platform || scriptEl?.getAttribute?.('platform') || null;
const debug = new URLSearchParams(window.location.search).has('smoothr-debug');

if (!scriptEl || !storeId) {
  if (debug) {
    console.warn(
      !scriptEl
        ? '[Smoothr SDK] initialization aborted: #smoothr-sdk script element not found'
        : '[Smoothr SDK] initialization aborted: data-store-id attribute missing'
    );
  }
} else {
  const config = mergeConfig({ storeId, platform, debug });
  if (config.platform === 'webflow-ecom') {
    console.warn('[Smoothr] Invalid platform "webflow-ecom" — defaulting to "webflow"');
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
        await waitForSessionReady();
        log('Fetching store settings');
        const data = await loadPublicConfig(storeId);
        config.settings = { ...(config.settings || {}), ...(data || {}) };
        log('Store settings loaded', config.settings);
      } catch (err) {
        debug && console.warn('[Smoothr SDK] Failed to fetch store settings', err);
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
        debug && console.warn('[Smoothr SDK] Failed to load adapter', err);
      }
    }

    try {
      log('Initializing auth feature');
      await import('./features/auth/init.js').then(m => m.init(config));
    } catch (err) {
      debug && console.warn('[Smoothr SDK] Auth init failed', err);
    }

    try {
      log('Initializing currency feature');
      const currency = await import('./features/currency/index.js');
      await currency.init(config);
    } catch (err) {
      debug && console.warn('[Smoothr SDK] Currency init failed', err);
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
      } catch (err) {
        debug && console.warn('[Smoothr SDK] Checkout init failed', err);
      }
    } else {
      log('No checkout triggers found, skipping checkout initialization');
    }

    if (hasCartTrigger) {
      try {
        log('Initializing cart feature');
        const cart = await import('./features/cart/init.js');
        await cart.init(config);
      } catch (err) {
        debug && console.warn('[Smoothr SDK] Cart init failed', err);
      }
    } else {
      log('No cart triggers found, skipping cart initialization');
    }
  })();
}

