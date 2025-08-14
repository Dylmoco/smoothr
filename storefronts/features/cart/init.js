import { mergeConfig } from '../config/globalConfig.js';
import * as cart from './index.js';
import { bindAddToCartButtons } from './addToCart.js';
import { renderCart, bindRemoveFromCartButtons } from './renderCart.js';

let initialized = false;

export async function init({ config, supabase, adapter } = {}) {
  if (initialized) return typeof window !== 'undefined' ? window.Smoothr?.cart : undefined;

  if (typeof window !== 'undefined') {
    globalThis.el =
      globalThis.el || (sel => document.querySelector(sel));
    globalThis.Zc = globalThis.Zc || {};
    globalThis.tl = globalThis.tl || {};
    globalThis.ol = globalThis.ol || {};
    globalThis.Cc = globalThis.Cc || {};
    globalThis.Xc = globalThis.Xc || {};
    globalThis.ll = globalThis.ll || {};
    globalThis.Pc = config || {};
    try {
      const initValue = JSON.stringify({
        items: [],
        meta: { lastModified: Date.now() }
      });
      localStorage.setItem('smoothr_cart', initValue);
    } catch {}
    const storage = window.localStorage;
    globalThis.al = globalThis.al || storage;
    globalThis.il = globalThis.il || storage;
  }

  mergeConfig(config);

  if (typeof window !== 'undefined') {
    const Smoothr = (window.Smoothr = window.Smoothr || {});
    Smoothr.cart = {
      ...cart,
      renderCart,
      addButtonPollingRetries: 0,
      addButtonPollingDisabled: false
    };
  }

  bindAddToCartButtons();
  renderCart();
  bindRemoveFromCartButtons();

  initialized = true;
  return typeof window !== 'undefined' ? window.Smoothr.cart : undefined;
}

export default init;
export { init };
