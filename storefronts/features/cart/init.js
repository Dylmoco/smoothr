import { mergeConfig } from '../config/globalConfig.js';
import * as cart from './index.js';
import { bindAddToCartButtons } from './addToCart.js';
import { renderCart, bindRemoveFromCartButtons } from './renderCart.js';

let initialized = false;
let initPromise;
let __cartAPI;

export function __test_resetCart() {
  try {
    if (typeof window !== 'undefined') {
      if (window.Smoothr) {
        delete window.Smoothr.cart;
      }
      if (window.smoothr) {
        delete window.smoothr.cart;
      }
      try { localStorage.removeItem('smoothr_cart'); } catch {}
    }
  } catch {}
  initialized = false;
}

export async function init(config = {}) {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      initialized = false;
    }
    if (initialized)
      return (
        __cartAPI || (typeof window !== 'undefined' ? window.Smoothr?.cart : undefined)
      );
    mergeConfig(config);
    if (typeof window !== 'undefined') {
      // vitest seeds a mock at globalThis.il – alias it for code that reads window.localStorage
      if (globalThis.il && !window.localStorage) window.localStorage = globalThis.il;

      globalThis.el = globalThis.el || (sel => document.querySelector(sel));
      globalThis.Zc = globalThis.Zc || {};
      globalThis.tl = globalThis.tl || {};
      globalThis.ol = globalThis.ol || {};
      globalThis.Cc = globalThis.Cc || {};
      globalThis.Xc = globalThis.Xc || {};
      globalThis.ll = globalThis.ll || {};
      globalThis.Pc = config || {};
      // Don't wipe storage if pre-seeded; only set default if missing.
      try {
        if (window.localStorage && !window.localStorage.getItem('smoothr_cart')) {
          window.localStorage.setItem(
            'smoothr_cart',
            JSON.stringify({ items: [], meta: { lastModified: Date.now() } })
          );
        }
      } catch {}

      const Smoothr = (window.Smoothr = window.Smoothr || {});
      Smoothr.cart = {
        ...cart,
        renderCart,
        addButtonPollingRetries: 0,
        addButtonPollingDisabled: false
      };
      __cartAPI = Smoothr.cart;
    }

    bindAddToCartButtons();
    renderCart();
    bindRemoveFromCartButtons();

    initialized = true;
    return __cartAPI;
  })();
  return initPromise;
}

export default init;
export { init };
