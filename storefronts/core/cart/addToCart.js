import * as cart from '../cart.js';

// Ensure the cart module is available on the global Smoothr object before any
// DOM bindings are attached. This prevents addItem calls from failing when the
// module isn't imported elsewhere.
if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {};
  // Use a shallow copy so the cart object remains extensible
  window.Smoothr.cart = {
    ...cart,
    addButtonPollingRetries: 0,
    addButtonPollingDisabled: false
  };
}

let initLogShown = false;
let noButtonsWarned = false;
let foundLogShown = false;
const MAX_POLL_ATTEMPTS = 10;
let pollAttempts = 0;

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Cart]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Cart]', ...args);
const err = (...args) => debug && console.error('[Smoothr Cart]', ...args);

export function initCartBindings() {
  if (debug && !initLogShown) {
    log('🧩 initCartBindings loaded and executing');
    initLogShown = true;
  }
  if (typeof document === 'undefined') return;
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart?.addItem) {
    warn('cart module not found');
    return;
  }

  const buttons = document.querySelectorAll('[data-smoothr-add]');
  if (debug && !foundLogShown)
    log(`found ${buttons.length} [data-smoothr-add] elements`);
  foundLogShown = true;

  if (buttons.length === 0) {
    const path = window.location?.pathname || '';
    if (path.includes('/checkout')) {
      if (debug) log('🧩 addToCart polling disabled on checkout page');
      return;
    }
    pollAttempts++;
    Smoothr.cart.addButtonPollingRetries = pollAttempts;
    if (pollAttempts >= MAX_POLL_ATTEMPTS) {
      warn(
        `No [data-smoothr-add] elements after ${MAX_POLL_ATTEMPTS} attempts—feature disabled`
      );
      Smoothr.cart.addButtonPollingDisabled = true;
      return;
    }
    if (!noButtonsWarned) {
      warn('no buttons found; retrying...');
      noButtonsWarned = true;
    }
    setTimeout(initCartBindings, 500);
    return;
  }

    buttons.forEach(btn => {
      if (debug) log('🔗 binding [data-smoothr-add] button', btn);
      if (btn.__smoothrBound) return;
      btn.__smoothrBound = true;

    btn.addEventListener('click', e => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (debug) log('🛒 Add to cart clicked:', btn);
      try {
        const rawPrice = btn.getAttribute('data-product-price') || '0';
        const price = Math.round(parseFloat(rawPrice) * 100);
        const product_id = btn.getAttribute('data-product-id');
        const name = btn.getAttribute('data-product-name');
        const options = btn.getAttribute('data-product-options');
        const isSubscription =
          btn.getAttribute('data-product-subscription') === 'true';

          if (!product_id || !name || isNaN(price)) {
            warn('Missing required cart attributes on:', btn);
            return;
          }

        const wrapper = btn.closest('[data-smoothr-product]');
        let image = '';
        let el = btn;
        while (el && !image) {
          const found = el.querySelector?.('[data-smoothr-image]');
          if (found?.src) image = found.src;
          el = el.parentElement;
        }
        if (!wrapper) {
          warn(`No [data-smoothr-product] found for product "${product_id}"`);
        }
        if (!image) {
          warn(`No [data-smoothr-image] found for product "${product_id}"`);
        }


        const item = {
          product_id,
          name,
          price,
          quantity: 1,
          options: options ? JSON.parse(options) : undefined,
          isSubscription,
          image
        };
        Smoothr.cart.addItem(item);
        if (typeof window.renderCart === 'function') {
          if (debug) log('🧼 Calling renderCart() to update UI');
          window.renderCart();
        } else {
          warn('renderCart not found');
        }
      } catch (err) {
        err('addToCart failed', err);
      }
    });
  });
}

export function initAddToCart() {
  document.addEventListener('DOMContentLoaded', () => {
    log('✅ DOM ready – calling initCartBindings');
    initCartBindings();
  });
}

if (typeof window !== 'undefined') {
  initAddToCart();
}
