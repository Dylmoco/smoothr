import { initAdapter as initWebflowAdapter } from 'storefronts/adapters/webflow.js';
import { loadPublicConfig } from 'storefronts/features/config/sdkConfig.js';

// Normalize any value-ish return into a promise we can safely await
function asPromise(x) {
  return x && typeof x.then === 'function' ? x : Promise.resolve(x);
}

// Ensure legacy global currency helper exists
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

export const SDK_TAG = 'auth-popup-locked-v1';
let __configReadyResolve;
if (typeof window !== 'undefined') {
  window.SMOOTHR_CONFIG_READY = new Promise(r => (__configReadyResolve = r));
  window.Smoothr = window.Smoothr || {};
  window.Smoothr.meta = Object.assign({}, window.Smoothr.meta, { sdkTag: SDK_TAG });
  if (window.SMOOTHR_DEBUG) {
    console.info('[Smoothr] build', { sdkTag: SDK_TAG, builtAt: '__BUILD_TIME__' });
  }
}

export async function ensureConfigLoaded() {
  return window.SMOOTHR_CONFIG_READY;
}

export function getCachedBrokerBase() {
  return window.SMOOTHR_CONFIG?.__brokerBase;
}

if (typeof window !== 'undefined') {
  window.ensureConfigLoaded = ensureConfigLoaded;
  window.getCachedBrokerBase = getCachedBrokerBase;
}

const Smoothr = (window.Smoothr = window.Smoothr || {});
if (!window.smoothr) window.smoothr = Smoothr;

try {
  const adapter = initWebflowAdapter(Smoothr.config || {});
  Smoothr.adapter = adapter;
  (async () => {
    try {
      await asPromise(adapter?.domReady?.());
    } catch (err) {
      console.warn('[Smoothr SDK] adapter.domReady error', err);
    }
    try {
      await asPromise(adapter?.observeDOMChanges?.());
    } catch (err) {
      console.warn('[Smoothr SDK] adapter.observeDOMChanges error', err);
    }
  })();
} catch (e) {
  console.warn('[Smoothr SDK] adapter init failed', e);
}

async function initFeatures() {
  const ctx = {
    config: Smoothr.config,
    supabase: Smoothr.__supabase,
    adapter: Smoothr?.adapter
  };

  const promises = [];
  if (getCachedBrokerBase()) {
    promises.push(
      import('storefronts/features/auth/init.js')
        .then(m => (m.default || m.init)?.(ctx))
        .catch(err => console.warn('[Smoothr SDK] Auth init failed', err))
    );
  } else {
    console.warn('[Smoothr SDK] Auth init skipped: broker base unresolved');
  }
  const hasCheckoutTrigger = document.querySelector('[data-smoothr="pay"]');
  if (hasCheckoutTrigger) {
    promises.push(
      import('storefronts/features/checkout/init.js').then(m =>
        (m.default || m.init)?.(ctx)
      ).catch(err =>
        console.warn('[Smoothr SDK] Checkout init failed', err)
      )
    );
  } else {
    console.warn(
      '[Smoothr SDK] No checkout triggers found, skipping checkout initialization'
    );
  }
  const hasCartTrigger =
    document.querySelector('[data-smoothr="add-to-cart"]') ||
    document.querySelector('[data-smoothr-total]') ||
    document.querySelector('[data-smoothr-cart]');
  if (hasCartTrigger) {
    promises.push(
      import('storefronts/features/cart/init.js').then(m =>
        (m.default || m.init)?.(ctx)
      ).catch(err =>
        console.warn('[Smoothr SDK] Cart init failed', err)
      )
    );
  } else {
    console.log(
      '[Smoothr SDK] No cart triggers found, skipping cart initialization'
    );
  }
  const hasCurrencyTrigger =
    document.querySelector('[data-smoothr-price]') ||
    document.querySelector('[data-smoothr-total]') ||
    document.querySelector('[data-smoothr-currency]');
  if (hasCurrencyTrigger) {
    promises.push(
      import('storefronts/features/currency/init.js').then(m =>
        (m.default || m.init)?.(ctx)
      ).catch(err =>
        console.warn('[Smoothr SDK] Currency init failed', err)
      )
    );
  }
  await Promise.allSettled(promises);
}

const scriptEl =
  typeof document !== 'undefined'
    ? document.currentScript || document.getElementById('smoothr-sdk')
    : null;

if (!scriptEl || !scriptEl.dataset || !scriptEl.dataset.storeId) {
  console.warn(
    '[Smoothr SDK] initialization aborted: #smoothr-sdk not found or data-store-id missing'
  );
} else {
  const storeId =
    scriptEl.dataset.storeId || scriptEl.getAttribute?.('data-store-id') || null;

  const forceAttr =
    scriptEl.dataset?.forceFormRedirect ||
    scriptEl.getAttribute?.('data-force-form-redirect');
  let forceFormRedirect;
  if (typeof forceAttr === 'string') {
    const v = forceAttr.toLowerCase();
    if (v === 'true' || v === '1') forceFormRedirect = true;
    else if (v === 'false' || v === '0') forceFormRedirect = false;
  }
  if (typeof forceFormRedirect === 'boolean') {
    window.SMOOTHR_CONFIG = {
      ...(window.SMOOTHR_CONFIG || {}),
      forceFormRedirect,
    };
  }

  let brokerBase;
  const cfgAttr = scriptEl?.dataset?.configUrl;
  if (cfgAttr) {
    try { brokerBase = new URL(cfgAttr).origin; } catch {}
  }
  if (scriptEl?.dataset?.brokerOrigin) {
    brokerBase = scriptEl.dataset.brokerOrigin;
  }
  if (!brokerBase && scriptEl?.src) {
    try {
      const u = new URL(scriptEl.src);
      if (u.hostname !== 'sdk.smoothr.io') brokerBase = u.origin;
    } catch {}
  }
  window.SMOOTHR_CONFIG = {
    ...(window.SMOOTHR_CONFIG || {}),
    __brokerBase: brokerBase
  };

  const scriptOrigin = scriptEl?.src ? new URL(scriptEl.src).origin : location.origin;
  const candidateUrls = [
    scriptEl?.dataset?.configUrl,
    `${scriptOrigin}/api/config`,
    'https://smoothr-admin.vercel.app/api/config'
  ].filter(Boolean);

  async function fetchFirstOk(urls) {
    for (const url of urls) {
      try {
        const u = new URL(url);
        u.searchParams.set('store_id', storeId);
        const res = await fetch(u.toString());
        const ok =
          res.ok ??
          (typeof res.status === 'undefined' || (res.status >= 200 && res.status < 300));
        if (ok) return res;
      } catch {
        // ignore errors
      }
    }
    return null;
  }

  Smoothr.ready = (async () => {
    const res = await fetchFirstOk(candidateUrls);
    const chosenUrl = res?.url ? new URL(res.url) : null;
    if (chosenUrl) {
      console.info('[Smoothr SDK] Using config URL:', chosenUrl.toString());
    }
    if (!res) return null;
    try {
      return await res.json();
    } catch {
      return null;
    }
  })();

  let _supabasePromise;
  Object.defineProperty(Smoothr, 'supabaseReady', {
    get() {
      if (!_supabasePromise) {
        _supabasePromise = (async () => {
          const cfg = await Smoothr.ready;
          if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return null;
          window.SMOOTHR_CONFIG = {
            ...(window.SMOOTHR_CONFIG || {}),
            storeId: cfg.storeId
          };
          if (window.Smoothr.__supabase) return window.Smoothr.__supabase;
          const { createClient } = await import('@supabase/supabase-js');
          const client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
            auth: {
              persistSession: true,
              storageKey: `smoothr_${cfg.storeId}`
            }
          });
          window.Smoothr.__supabase = client;
          return client;
        })();
      }
      return _supabasePromise;
    }
  });

  (async () => {
    const fetched = await Smoothr.ready;
    if (!fetched) {
      console.warn(
        '[Smoothr SDK] Config fetch failed; aborting feature initialization'
      );
      return;
    }

    const existing = Smoothr.config || {};
    const mergedConfig = { ...existing, ...fetched };
    Smoothr.config = mergedConfig;
    const resolvedStoreId = fetched?.storeId ?? storeId;
    window.SMOOTHR_CONFIG = {
      ...(window.SMOOTHR_CONFIG || {}),
      ...mergedConfig,
      storeId: resolvedStoreId
    };
    try {
      const supabase = await Smoothr.supabaseReady;
      const pub = await loadPublicConfig(resolvedStoreId, supabase);
      Object.assign(window.SMOOTHR_CONFIG, pub || {});
      if (window.SMOOTHR_DEBUG) {
        console.info('[Smoothr] config-first ready', {
          signInRedirect: window.SMOOTHR_CONFIG.sign_in_redirect_url
        });
      }
    } catch {}
    if (typeof window.SMOOTHR_CONFIG.__brokerBase === 'undefined') {
      let bb;
      const cfgAttr = scriptEl?.dataset?.configUrl;
      if (cfgAttr) {
        try { bb = new URL(cfgAttr).origin; } catch {}
      }
      if (scriptEl?.dataset?.brokerOrigin) {
        bb = scriptEl.dataset.brokerOrigin;
      }
      if (!bb && scriptEl?.src) {
        try {
          const u = new URL(scriptEl.src);
          if (u.hostname !== 'sdk.smoothr.io') bb = u.origin;
        } catch {}
      }
      if (typeof bb !== 'undefined') {
        window.SMOOTHR_CONFIG = {
          ...(window.SMOOTHR_CONFIG || {}),
          __brokerBase: bb
        };
      }
    }
    __configReadyResolve?.(true);

    await initFeatures();
  })();
}

export async function __test_bootstrap(fakeConfig = {}) {
  window.Smoothr = window.Smoothr || {};
  window.Smoothr.config = { ...(window.Smoothr.config || {}), ...fakeConfig };
  return initFeatures();
}
