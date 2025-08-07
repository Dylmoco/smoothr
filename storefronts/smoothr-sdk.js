import { supabase } from '../supabase/supabaseClient.js';
import { mergeConfig } from './features/config/globalConfig.js';

// Ensure legacy global currency helper exists
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

const scriptEl = document.getElementById('smoothr-sdk');
const storeId = scriptEl?.dataset?.storeId || null;
const platform =
  scriptEl?.dataset?.platform || scriptEl?.getAttribute?.('platform') || null;
const debug = new URLSearchParams(window.location.search).get('smoothr-debug') === 'true';

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
  const Smoothr = (window.Smoothr = window.Smoothr || {});
  window.smoothr = window.smoothr || Smoothr;
  Smoothr.config = config;

  const log = (...args) => debug && console.log('[Smoothr SDK]', ...args);
  log('Config initialized', config);

  (async () => {
    if (storeId) {
      try {
        log('Fetching store settings');
        const { data } = await supabase
          .from('public_store_settings')
          .select('active_payment_gateway')
          .eq('store_id', storeId)
          .maybeSingle();
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
      await import('./features/currency/init.js').then(m => m.init(config));
    } catch (err) {
      debug && console.warn('[Smoothr SDK] Currency init failed', err);
    }
  })();
}

