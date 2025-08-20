import { getConfig } from '../config/globalConfig.js';
import { renderCart } from './renderCart.js';

const { debug } = getConfig();
const log = (...args) => debug && console.log('[Smoothr Cart]', ...args);

let _initPromise;
const _bound = new WeakSet();
const _state = { items: [] };

function bindQtyControls() {
  const w = globalThis.window || globalThis;
  const d = w.document || globalThis.document;
  if (!d?.addEventListener) return;
  if (d.__smoothrQtyBound__) return;
  d.__smoothrQtyBound__ = true;
  d.addEventListener('click', e => {
    const t = e.target?.closest?.(
      '[data-smoothr="qty-plus"],[data-smoothr="qty-minus"],[data-smoothr-qty]'
    );
    if (!t) return;
    const attr = t.getAttribute('data-smoothr');
    const legacy = t.getAttribute('data-smoothr-qty');
    const delta =
      attr === 'qty-plus' || legacy === '+' ? 1 :
      attr === 'qty-minus' || legacy === '-' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    e.stopPropagation();
    const pid =
      t.getAttribute('data-product-id') ||
      t.closest('.smoothr-cart-rendered')
        ?.querySelector('[data-product-id]')
        ?.getAttribute('data-product-id');
    if (!pid) return;
    const line = t.closest('.smoothr-cart-rendered');
    let current = parseInt(
      line?.querySelector('[data-smoothr-qty]')?.textContent || '1',
      10
    );
    if (isNaN(current) || current < 1) current = 1;
    const next = Math.max(1, current + delta);
    try { w.Smoothr?.cart?.updateQuantity?.(pid, next); } catch {}
  });
}

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
      getSubtotal: () =>
        _state.items.reduce(
          (sum, i) => sum + ((+i.price || 0) * (+i.quantity || 1)),
          0
        ),
      addItem: item => {
        const existing = _state.items.find(
          i => i?.product_id === item?.product_id
        );
        if (existing) {
          existing.quantity =
            (existing.quantity || 1) + (+item.quantity || 1);
        } else {
          _state.items.push({ ...item, quantity: +item.quantity || 1 });
        }
      },
      updateQuantity: (product_id, qty) => {
        const item = _state.items.find(i => i?.product_id === product_id);
        if (!item) return false;
        const n = Math.max(1, parseInt(qty, 10) || 1);
        item.quantity = n;
        try { w.Smoothr?.cart?.renderCart?.(); } catch {}
        return true;
      },
      clear: () => {
        _state.items.length = 0;
        try { w.Smoothr?.cart?.renderCart?.(); } catch {}
      },
      /**
       * Remove by product_id (matches renderCart/remove button wiring).
       */
      removeItem: (product_id) => {
        if (!product_id) return false;
        const idx = _state.items.findIndex(i => i?.product_id === product_id);
        if (idx < 0) return false;
        _state.items.splice(idx, 1);
        try { w.Smoothr?.cart?.renderCart?.(); } catch {}
        return true;
      },
    };

    try {
      await bindCartButtons();
      w.Smoothr = w.Smoothr || {};
      w.Smoothr.cart = api;
      if (!w.Smoothr.cart.renderCart) {
        w.Smoothr.cart.renderCart = renderCart;
      }
      bindQtyControls();
      const { bindAddToCartButtons } = await import('./addToCart.js');
      await bindAddToCartButtons();
      // Initial render so templates hide and totals format on first load
      try { w.Smoothr.cart.renderCart?.(); } catch {}
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
      bindQtyControls();
      // Ensure initial empty render even on fallback path
      try { w.Smoothr.cart.renderCart?.(); } catch {}
      log('cart init complete (fallback)', _state.items.length, 'items');
    }
    return api;
  })();
  return _initPromise;
}
export default init;
// tests import a named initCart
export const initCart = init;
