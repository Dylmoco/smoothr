
// Ensure legacy global currency helper exists
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

async function initFeatures() {
  const Smoothr = (window.Smoothr = window.Smoothr || {});
  const ctx = {
    config: Smoothr.config,
    supabase: Smoothr.__supabase,
    adapter: Smoothr?.adapter
  };

  const hasAuthTrigger = document.querySelector(
    '[data-smoothr="login"], [data-smoothr="sign-out"], [data-smoothr="signup"], [data-smoothr="password-reset"], [data-smoothr="password-reset-confirm"], form[data-smoothr="auth-form"]'
  );
  if (hasAuthTrigger) {
    try {
      const m = await import('storefronts/features/auth/init.js');
      (m.default || m.init)?.(ctx);
    } catch (err) {
      console.warn('[Smoothr SDK] Auth init failed', err);
    }
  }

  const hasCheckoutTrigger = document.querySelector('[data-smoothr="pay"]');
  if (hasCheckoutTrigger) {
    try {
      const m = await import('storefronts/features/checkout/init.js');
      (m.default || m.init)?.(ctx);
    } catch (err) {
      console.warn('[Smoothr SDK] Checkout init failed', err);
    }
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
    try {
      const m = await import('storefronts/features/cart/init.js');
      (m.default || m.init)?.(ctx);
    } catch (err) {
      console.warn('[Smoothr SDK] Cart init failed', err);
    }
  } else {
    console.log(
      '[Smoothr SDK] No cart triggers found, skipping cart initialization'
    );
  }
}

const scriptEl = document.currentScript || document.getElementById('smoothr-sdk');
const storeId =
  scriptEl?.dataset?.storeId || scriptEl?.getAttribute?.('data-store-id') || null;

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

  const Smoothr = (window.Smoothr = window.Smoothr || {});
  window.smoothr = window.smoothr || Smoothr;

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
    Smoothr.config = { ...existing, ...fetched };

    await initFeatures();
  })();
}

export async function __test_bootstrap(fakeConfig = {}) {
  window.Smoothr = window.Smoothr || {};
  window.Smoothr.config = { ...(window.Smoothr.config || {}), ...fakeConfig };
  return initFeatures();
}
