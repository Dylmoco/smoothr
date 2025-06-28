export function initAddToCart() {
  if (typeof document === 'undefined') return;
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart?.addItem) {
    console.warn('smoothr:addToCart cart module not found');
    return;
  }
  document.querySelectorAll('[data-smoothr-add]').forEach(btn => {
    if (btn.__smoothrBound) return;
    btn.addEventListener('click', () => {
      try {
        const id = btn.getAttribute('data-product-id') || '';
        const name = btn.getAttribute('data-product-name') || '';
        const priceAttr = btn.getAttribute('data-product-price') || '0';
        const price = parseInt(priceAttr, 10) || 0;
        const optAttr = btn.getAttribute('data-product-options');
        let options;
        if (optAttr) {
          try {
            options = JSON.parse(optAttr);
          } catch (err) {
            console.warn('smoothr:addToCart options JSON invalid', err);
          }
        }
        const subscription =
          btn.getAttribute('data-product-subscription') === 'true';
        Smoothr.cart.addItem({
          product_id: id,
          name,
          price,
          options,
          subscription
        });
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          const detail = Smoothr.cart.getCart ? Smoothr.cart.getCart() : {};
          window.dispatchEvent(
            new CustomEvent('smoothr:cart:updated', { detail })
          );
        }
        if (Smoothr.debug || window.SMOOTHR_CONFIG?.debug) {
          console.log('smoothr:addToCart added', { id, name, price, options, subscription });
        }
      } catch (err) {
        console.error('smoothr:addToCart failed', err);
      }
    });
    btn.__smoothrBound = true;
  });
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initAddToCart);
}
