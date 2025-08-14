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
    const Smoothr = (window.Smoothr = window.Smoothr || {});
    window.smoothr = window.smoothr || Smoothr;

    Smoothr.ready = (async () => {
      // Load configuration helpers first so global config can be merged
      const [{ mergeConfig }] = await Promise.all([
        import('./features/config/globalConfig.js')
      ]);

      const initialPlatform = window.Smoothr?.config?.platform;
      const config = mergeConfig(
        platform
          ? { storeId, platform, debug }
          : { storeId, platform: initialPlatform, debug }
      );
      if (config.platform === 'webflow-ecom') {
        console.warn('[Smoothr] Invalid platform "webflow-ecom" — defaulting to "webflow"');
        config.platform = 'webflow';
      }

      const log = (...args) => debug && console.log('[Smoothr SDK]', ...args);

      const fallback = { public_settings: {}, active_payment_gateway: null };
      let data = fallback;
      if (storeId) {
        try {
          const res = await fetch(
            `https://smoothr-admin.vercel.app/api/config?store_id=${storeId}`
          );
          if (res.ok) {
            const json = await res.json();
            data = json.data || fallback;
          }
        } catch (err) {
          debug && console.warn('[Smoothr SDK] Failed to fetch store settings', err);
        }
      }

      config.settings = {
        ...(config.settings || {}),
        ...(data.public_settings || {})
      };
      config.active_payment_gateway = data.active_payment_gateway ?? null;
      config.publishable_key = data.publishable_key;
      config.base_currency = data.base_currency;

      // Expose config globally before loading any features
      Smoothr.config = config;
      log('Config initialized', config);

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
        await import('storefronts/features/auth/init.js');
      } catch (err) {
        debug && console.warn('[Smoothr SDK] Auth init failed', err);
      }

      try {
        log('Initializing currency feature');
        const currency = await import('storefronts/features/currency/index.js');
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
          await import('storefronts/features/checkout/init.js');
        } catch (err) {
          debug && console.warn('[Smoothr SDK] Checkout init failed', err);
        }
      } else {
        log('No checkout triggers found, skipping checkout initialization');
      }

      if (hasCartTrigger) {
        try {
          log('Initializing cart feature');
          await import('storefronts/features/cart/index.js');
        } catch (err) {
          debug && console.warn('[Smoothr SDK] Cart init failed', err);
        }
      } else {
        log('No cart triggers found, skipping cart initialization');
      }
    })();
  }

