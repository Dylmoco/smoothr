import { initAdapter as initWebflowAdapter } from 'storefronts/adapters/webflow.js';
import { loadPublicConfig } from 'storefronts/features/config/sdkConfig.js';

// Ensure legacy global currency helper exists
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

function ensurePreconnect(host) {
  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    const tags = [
      ['preconnect', host, ''],
      ['dns-prefetch', host, null]
    ];
    for (const [rel, href, crossOrigin] of tags) {
      if (!head.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        const l = document.createElement('link');
        l.rel = rel;
        l.href = href;
        if (crossOrigin !== null) l.crossOrigin = crossOrigin;
        head.appendChild(l);
      }
    }
  } catch {}
}

export function injectAuthPreconnects(cfg) {
  try {
    const supabaseUrl =
      (cfg && cfg.supabase_url) ||
      (window.SMOOTHR_CONFIG && window.SMOOTHR_CONFIG.supabase_url);
    if (supabaseUrl) {
      const { host } = new URL(supabaseUrl);
      ensurePreconnect(`https://${host}`);
    }
    ensurePreconnect('https://accounts.google.com');
  } catch {}
}

export function isIOSSafari() {
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  return iOS && webkit;
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
  return window.SMOOTHR_CONFIG?.__brokerBase || null;
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
  adapter?.domReady?.().catch(() => {});
  adapter?.observeDOMChanges?.();
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
  // Auth is a core module: always initialize (still lazy-loaded)
  promises.push(
    import('storefronts/features/auth/init.js')
      .then(m => (m.default || m.init)?.(ctx))
      .catch(err => console.warn('[Smoothr SDK] Auth init failed', err))
  );
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

const scriptEl = document.currentScript || document.getElementById('smoothr-sdk');
const storeId =
  scriptEl?.dataset?.storeId || scriptEl?.getAttribute?.('data-store-id') || null;

const forceAttr =
  scriptEl?.dataset?.forceFormRedirect ||
  scriptEl?.getAttribute?.('data-force-form-redirect');
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

if (!scriptEl || !storeId) {
  console.warn(
    '[Smoothr SDK] initialization aborted: #smoothr-sdk script element not found or data-store-id missing'
  );
} else {
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

  let supabaseReadyPromise = null;

  // Make the property writable & configurable so tests can override it.
  // We keep a module-level promise as the canonical source of truth.
  Object.defineProperty(Smoothr, 'supabaseReady', {
    value: null,
    writable: true,
    configurable: true
  });

  // Lazily create (and cache) a Supabase client promise.
  // Always return the same promise once created.
  export function ensureSupabaseReady() {
    if (Smoothr.supabaseReady) return Smoothr.supabaseReady;
    if (!supabaseReadyPromise) {
      supabaseReadyPromise = (async () => {
        const cfg = await Smoothr.ready;
        if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return null;

        // Expose storeId for downstream storageKey logic (stable behavior).
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
    Smoothr.supabaseReady = supabaseReadyPromise;
    return supabaseReadyPromise;
  }

  // Test-only helper to inject/replace the promise safely.
  export function __setSupabaseReadyForTests(value) {
    supabaseReadyPromise = Promise.resolve(value);
    Smoothr.supabaseReady = supabaseReadyPromise;
  }

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
      const supabase = await ensureSupabaseReady();
      const pub = await loadPublicConfig(resolvedStoreId, supabase);
      Object.assign(window.SMOOTHR_CONFIG, pub || {});
      if (window.SMOOTHR_DEBUG) {
        console.info('[Smoothr] config-first ready', {
          signInRedirect: window.SMOOTHR_CONFIG.sign_in_redirect_url
        });
      }
    } catch {}
    let brokerBase = window.SMOOTHR_CONFIG?.broker_origin || null;
    if (!brokerBase) {
      const cfgAttr = scriptEl?.dataset?.configUrl;
      if (cfgAttr) {
        try { brokerBase = new URL(cfgAttr).origin; } catch {}
      }
    }
    if (!brokerBase && scriptEl?.src) {
      try {
        const u = new URL(scriptEl.src);
        if (u.hostname !== 'sdk.smoothr.io') brokerBase = u.origin;
      } catch {}
    }
    if (!brokerBase) brokerBase = 'https://smoothr.vercel.app';
    window.SMOOTHR_CONFIG = {
      ...(window.SMOOTHR_CONFIG || {}),
      __brokerBase: brokerBase
    };
    try {
      injectAuthPreconnects(window.SMOOTHR_CONFIG);
    } catch {}
    __configReadyResolve?.(true);

    await initFeatures();
  })();
}

export async function __test_bootstrap(fakeConfig = {}) {
  window.Smoothr = window.Smoothr || {};
  window.Smoothr.config = { ...(window.Smoothr.config || {}), ...fakeConfig };
  return initFeatures();
}
