// Smoothr SDK bootstrapper
// Automatically initializes Smoothr modules and features based on DOM attributes.

const scriptEl = document.getElementById('smoothr-sdk');
const storeId = scriptEl?.dataset?.storeId || null;
const platform =
  scriptEl?.dataset?.platform || scriptEl?.getAttribute?.('platform') || null;

const debug = new URLSearchParams(location.search).get('smoothr-debug') === 'true';

if (!scriptEl || !storeId) {
  if (debug) {
    console.warn(
      !scriptEl
        ? '[Smoothr] initialization aborted: #smoothr-sdk script element not found'
        : '[Smoothr] initialization aborted: data-store-id attribute missing'
    );
  }
} else {
  const Smoothr = (window.Smoothr = window.Smoothr || {});
  window.smoothr = Smoothr;
  Smoothr.config = { storeId, platform, debug };

  // Basic event bus for cross-feature communication
  const events = (() => {
    const listeners = {};
    return {
      on(event, handler) {
        (listeners[event] = listeners[event] || []).push(handler);
      },
      off(event, handler) {
        const list = listeners[event];
        if (!list) return;
        const idx = list.indexOf(handler);
        if (idx !== -1) list.splice(idx, 1);
      },
      emit(event, detail) {
        (listeners[event] || []).forEach(fn => {
          try {
            fn(detail);
          } catch (err) {
            console.error('[Smoothr events]', err);
          }
        });
      }
    };
  })();
  Smoothr.events = events;

  if (debug) {
    console.groupCollapsed('[Smoothr]');
    console.log('Store ID:', storeId);
    console.log('Platform:', platform);
  }

  // helper for safe dynamic imports
  async function safeImport(path) {
    try {
      return await import(path);
    } catch (err) {
      if (debug) console.warn(`Failed to load module ${path}`, err);
      return null;
    }
  }

  let cartInitPromise = null;
  let checkoutInitPromise = null;

  async function scanSpecialFeatures({ log = true, loaded } = {}) {
    const tasks = [];

    if (
      !cartInitPromise &&
      typeof document !== 'undefined' &&
      document.querySelector?.('[data-smoothr="add-to-cart"]')
    ) {
      cartInitPromise = safeImport('./features/cart/init.js');
      tasks.push(
        cartInitPromise.then(async mod => {
          if (mod?.init) await mod.init(Smoothr.config);
          return mod ? 'cart' : null;
        })
      );
    }

    if (
      !checkoutInitPromise &&
      typeof document !== 'undefined' &&
      document.querySelector?.('[data-smoothr="pay"]')
    ) {
      checkoutInitPromise = safeImport('./features/checkout/init.js');
      tasks.push(
        checkoutInitPromise.then(async mod => {
          if (mod?.init) await mod.init(Smoothr.config);
          return mod ? 'checkout' : null;
        })
      );
    }

    const names = (await Promise.all(tasks)).filter(Boolean);
    if (loaded && names.length) loaded.push(...names);
    if (log && debug && names.length) {
      console.log(`[Smoothr] Loaded features: ${names.join(', ')}`);
      if (names.includes('checkout')) {
        const gateway = Smoothr.config?.settings?.active_payment_gateway;
        if (gateway) console.log(`[Smoothr] Active gateway: ${gateway}`);
      }
    }
  }

  // Initialize core modules
  const auth = await safeImport('./features/auth/index.js');
  if (auth) {
    const instance = auth.default ?? auth;
    Smoothr.auth = instance;
    if (typeof auth.init === 'function') {
      await auth.init(Smoothr.config);
    } else if (typeof instance.init === 'function') {
      await instance.init(Smoothr.config);
    }
  }

  const currency = await safeImport('./features/currency/index.js');
  if (currency) {
    const instance = currency.default ?? currency;
    Smoothr.currency = instance;
    if (typeof currency.init === 'function') {
      await currency.init(Smoothr.config);
    } else if (typeof instance.init === 'function') {
      await instance.init(Smoothr.config);
    }
  }

  // Platform adapter loading
  let adapter = null;
  if (platform) {
    adapter = await safeImport(`./adapters/${platform}.js`);
    if (!adapter) {
      // scaffold placeholder adapter
      adapter = {
        platformReady: async () => {},
        domReady: async () => {},
        observeDOMChanges: () => {}
      };
    }
    await adapter.platformReady?.(Smoothr.config);
    await scanSpecialFeatures();
  }

  async function runFeatureInit() {
    const elements = Array.from(
      (typeof document !== 'undefined' && document.querySelectorAll?.('[data-smoothr]')) || []
    );
    let featureNames = [...new Set(elements.map(el => el.getAttribute('data-smoothr')))].filter(
      name => !!name && !['add-to-cart', 'pay'].includes(name)
    );
    const loaded = [];

    await scanSpecialFeatures({ log: false, loaded });

    const imports = featureNames.map(async name => {
      try {
        const mod = await import(`./features/${name}/index.js`);
        const instance = mod.default ?? mod;
        Smoothr[name] = instance;
        loaded.push(name);
        if (typeof mod.init === 'function') {
          await mod.init(Smoothr.config);
        } else if (typeof instance.init === 'function') {
          await instance.init(Smoothr.config);
        }
      } catch (err) {
        if (debug) console.warn(`Feature "${name}" failed to load`, err);
      }
    });

    Promise.all(imports).then(() => {
      if (debug) {
        console.log('DOM scan:', featureNames);
        if (loaded.length) {
          console.log(`[Smoothr] Loaded features: ${loaded.join(', ')}`);
          if (loaded.includes('checkout')) {
            const gateway = Smoothr.config?.settings?.active_payment_gateway;
            if (gateway) console.log(`[Smoothr] Active gateway: ${gateway}`);
          }
        }
        console.groupEnd();
      }
    });
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(async () => {
    await adapter?.domReady?.(Smoothr.config);
    await scanSpecialFeatures();
    adapter?.observeDOMChanges?.(Smoothr.config);
    runFeatureInit();
  });
}

// TODO: Load third-party SDKs (e.g., Stripe) when required by features.
