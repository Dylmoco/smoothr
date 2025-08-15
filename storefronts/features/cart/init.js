import { bindAddToCartButtons } from './addToCart.js';

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
    } catch { /* ignore and try next key */ }
  }
}

export function __test_resetCart() {
  _state.items.length = 0;
  _initPromise = undefined;
  const w = globalThis.window || globalThis;
  if (w.Smoothr) delete w.Smoothr.cart;
}
function bindCartButtons() {
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

  try { bindAddToCartButtons(); } catch {}
}

export async function init() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const w = globalThis.window || globalThis;
    w.Smoothr = w.Smoothr || {};
    if (w.Smoothr.cart) return w.Smoothr.cart;

    loadFromStorage();
    const api = {
      getCart: () => ({ items: _state.items.slice() }),
      getSubtotal: () => _state.items.reduce((sum, i) => sum + (+i.price || 0), 0),
      addItem: (item) => { _state.items.push(item); },
      clear: () => { _state.items.length = 0; },
    };

    w.Smoothr.cart = api;
    try { bindCartButtons(); } catch {}
    return api;
  })();
  return _initPromise;
}
export default init;
// tests import a named initCart
export const initCart = init;
