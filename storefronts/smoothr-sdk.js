// Smoothr SDK bootstrapper
// Automatically initializes Smoothr modules and features based on DOM attributes.

const scriptEl = document.getElementById('smoothr-sdk');
const storeId = scriptEl?.dataset?.storeId || null;
const platform = scriptEl?.dataset?.platform || null;

const debug = new URLSearchParams(location.search).get('smoothr-debug') === 'true';

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
}

function runFeatureInit() {
  const elements = Array.from(document.querySelectorAll('[data-smoothr]'));
  const featureNames = [...new Set(elements.map(el => el.getAttribute('data-smoothr')))].filter(Boolean);
  const loaded = [];

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
      console.log('Loaded features:', loaded);
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
  adapter?.observeDOMChanges?.(Smoothr.config);
  runFeatureInit();
});

// TODO: Load third-party SDKs (e.g., Stripe) when required by features.
