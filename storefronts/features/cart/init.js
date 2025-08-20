import { getConfig } from '../config/globalConfig.js';
import { renderCart } from './renderCart.js';

const { debug } = getConfig();
const log = (...args) => debug && console.log('[Smoothr Cart]', ...args);

let _initPromise;
const _bound = new WeakSet();
const _state = { items: [] };

function loadFromStorage() {
  // Tests set a localStorage mock on globalThis.il
  const store = globalThis.il || globalThis.localStorage;
  if (!store?.getItem) return;
  const candidates = ['cart', 'smoothr_cart', 'shopping_cart'];
  for (const key of candidates) {
    try {
      const raw = store.getItem(key);
      if (!raw) continue;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const items = parsed?.items ?? parsed ?? [];
      if (Array.isArray(items)) { _state.items = items.slice(); return; }
    } catch {
      /* ignore and try next key */
    }
  }
}

async function domReady() {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    await new Promise(resolve =>
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    );
  }
}

export function __test_resetCart() {
  _state.items.length = 0;
  _initPromise = undefined;
  const w = globalThis.window || globalThis;
  if (w.Smoothr) delete w.Smoothr.cart;
}
async function bindCartButtons() {
  const w = globalThis.window || globalThis;
  const d = w.document || globalThis.document;
  if (!d?.querySelectorAll) return;
  const sel = [
    '#smoothr-cart-toggle',
    '.smoothr-cart-toggle',
    '[data-smoothr-cart-toggle]',
    '[data-smoothr="cart-toggle"]',
  ].join(',');
  d.querySelectorAll(sel).forEach((el) => {
    if (!_bound.has(el) && typeof el.addEventListener === 'function') {
      el.addEventListener('click', () => {});
      _bound.add(el);
    }
  });
}

export async function init() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const w = globalThis.window || globalThis;
    if (w.Smoothr?.cart) return w.Smoothr.cart;

    log('cart init start');
    loadFromStorage();
    await domReady();
    const api = {
      getCart: () => ({ items: _state.items.slice() }),
      getSubtotal: () => _state.items.reduce((sum, i) => sum + (+i.price || 0), 0),
      addItem: (item) => {
        _state.items.push(item);
      },
      clear: () => {
        _state.items.length = 0;
      },
    };

    try {
      await bindCartButtons();
      w.Smoothr = w.Smoothr || {};
      w.Smoothr.cart = api;
      if (!w.Smoothr.cart.renderCart) {
        w.Smoothr.cart.renderCart = renderCart;
      }
      const { bindAddToCartButtons } = await import('./addToCart.js');
      await bindAddToCartButtons();
      // Single-shot late-node fallback for add-to-cart buttons
      if (w.document && !w.document.querySelector('[data-smoothr="add-to-cart"]')) {
        const mo = new MutationObserver((_, obs) => {
          if (w.document.querySelector('[data-smoothr="add-to-cart"]')) {
            obs.disconnect();
            bindAddToCartButtons();
            if (debug) log('🔁 late add-to-cart button detected, rebinding');
          }
        });
        mo.observe(w.document.body, { childList: true, subtree: true });
      }
      log('cart init complete', _state.items.length, 'items');
    } catch {
      w.Smoothr = w.Smoothr || {};
      w.Smoothr.cart = api;
      if (!w.Smoothr.cart.renderCart) {
        w.Smoothr.cart.renderCart = renderCart;
      }
      log('cart init complete (fallback)', _state.items.length, 'items');
    }
    return api;
  })();
  return _initPromise;
}
export default init;
// tests import a named initCart
export const initCart = init;
