import * as cart from '../../core/cart.js';

// Ensure the cart module is available on the global Smoothr object before any
// DOM bindings are attached. This prevents addItem calls from failing when the
// module isn't imported elsewhere.
if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {};
  // Use a shallow copy so the cart object remains extensible
  window.Smoothr.cart = { ...cart };
}

export function initCartBindings() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  if (debug) console.log('🧩 initCartBindings loaded and executing');
  if (typeof document === 'undefined') return;
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart?.addItem) {
    console.warn('smoothr:addToCart cart module not found');
    return;
  }

  const buttons = document.querySelectorAll('[data-smoothr-add]');
  if (debug)
    console.log(
      `smoothr:addToCart found ${buttons.length} [data-smoothr-add] elements`
    );

  if (buttons.length === 0) {
    const path = window.location?.pathname || '';
    if (path.includes('/checkout')) {
      if (debug) console.log('🧩 addToCart polling disabled on checkout page');
      return;
    }
    console.warn('smoothr:addToCart no buttons found; retrying...');
    setTimeout(initCartBindings, 500);
    return;
  }

  buttons.forEach(btn => {
    if (debug) console.log('🔗 binding [data-smoothr-add] button', btn);
    if (btn.__smoothrBound) return;
    btn.__smoothrBound = true;

    btn.addEventListener('click', e => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (debug) console.log('🛒 Add to cart clicked:', btn);
      try {
        const rawPrice = btn.getAttribute('data-product-price') || '0';
        const price = Math.round(parseFloat(rawPrice) * 100);
        const product_id = btn.getAttribute('data-product-id');
        const name = btn.getAttribute('data-product-name');
        const options = btn.getAttribute('data-product-options');
        const isSubscription =
          btn.getAttribute('data-product-subscription') === 'true';

        if (!product_id || !name || isNaN(price)) {
          console.warn('🧨 Missing required cart attributes on:', btn);
          return;
        }

        const wrapper = btn.closest('[data-smoothr-product]');
        const imageEl = wrapper ? wrapper.querySelector('.product-image') : null;
        const image = imageEl?.src || '';

        Smoothr.cart.addItem({
          product_id,
          name,
          price,
          quantity: 1,
          options: options ? JSON.parse(options) : undefined,
          isSubscription,
          image
        });
        if (typeof window.renderCart === 'function') {
          if (debug) console.log('🧼 Calling renderCart() to update UI');
          window.renderCart();
        } else {
          console.warn('⚠️ renderCart not found');
        }
      } catch (err) {
        console.error('smoothr:addToCart failed', err);
      }
    });
  });
}

export function initAddToCart() {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM ready – calling initCartBindings');
    initCartBindings();
  });
}

if (typeof window !== 'undefined') {
  initAddToCart();
}
