import * as cart from './index.js';

let initialized = false;

export async function init(config = {}) {
  if (initialized || (typeof window !== 'undefined' && window.Smoothr?.cart?.__initialized)) {
    return;
  }
  initialized = true;

  if (typeof window === 'undefined') {
    return;
  }

  window.SMOOTHR_CONFIG = { ...(window.SMOOTHR_CONFIG || {}), ...config };

  const Smoothr = (window.Smoothr = window.Smoothr || {});
  const existingCart = Smoothr.cart || {};
  Smoothr.cart = {
    ...existingCart,
    addToCart: cart.addItem,
    getCart: cart.getCart,
    clearCart: cart.clearCart,
    __initialized: true
  };

  function bind() {
    const buttons = document.querySelectorAll('[data-smoothr="add-to-cart"]');
    buttons.forEach(btn => {
      if (btn.__smoothrCartBound) return;
      btn.__smoothrCartBound = true;
      btn.addEventListener('click', e => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        const product_id = btn.getAttribute('data-product-id');
        const name = btn.getAttribute('data-product-name');
        const rawPrice = btn.getAttribute('data-product-price') || '0';
        const price = Math.round(parseFloat(rawPrice) * 100);
        const options = btn.getAttribute('data-product-options');
        const isSubscription = btn.getAttribute('data-product-subscription') === 'true';

        let image = '';
        let el = btn;
        while (el && !image) {
          const found = el.querySelector?.('[data-smoothr-image]');
          if (found) {
            image = found.getAttribute?.('src') || found.src || '';
          }
          el = el.parentElement;
        }

        if (!image && window.SMOOTHR_CONFIG?.debug) {
          console.warn('[Smoothr]', `No [data-smoothr-image] found for product "${product_id}"`);
        }

        const item = {
          product_id,
          name,
          price,
          quantity: 1,
          image,
          isSubscription
        };
        if (options) {
          try {
            item.options = JSON.parse(options);
          } catch {
            item.options = options;
          }
        }
        Smoothr.cart.addToCart(item);
      });
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bind, { once: true });
    } else {
      bind();
    }
  }

  if (window.SMOOTHR_CONFIG.debug) {
    console.log('[Smoothr] Cart module loaded');
  }
}

