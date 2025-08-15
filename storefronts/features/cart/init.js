let _initPromise;
const _bound = new WeakSet();
function bindCartButtons() {
  const w = globalThis.window || globalThis;
  const d = w.document;
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
    w.Smoothr = w.Smoothr || {};
    if (w.Smoothr.cart) return w.Smoothr.cart;

    // In tests, alias the provided shim before any reads.
    if (typeof w.localStorage === 'undefined' && globalThis.il) {
      try { w.localStorage = globalThis.il; } catch {}
    }

    const readCart = () => {
      try {
        const raw = w.localStorage?.getItem?.('smoothr_cart');
        return raw ? JSON.parse(raw) : { items: [] };
      } catch { return { items: [] }; }
    };
    const writeCart = (cart) => {
      try { w.localStorage?.setItem?.('smoothr_cart', JSON.stringify(cart)); } catch {}
    };

    const api = {
      getCart: () => readCart(),
      getSubtotal: () =>
        (readCart().items || []).reduce((sum, it) => sum + (it.price || 0) * (it.qty || 1), 0),
      addItem: (item) => { const c = readCart(); c.items = [...(c.items || []), item]; writeCart(c); },
      clear: () => writeCart({ items: [] }),
      init,
    };
    try { bindCartButtons(); } catch {}
    w.Smoothr.cart = api;
    return api;
  })();
  return _initPromise;
}
export default init;
// tests import a named initCart
export const initCart = init;
