import { getConfig } from '../config/globalConfig.js';

let initLogShown = false;
let noButtonsWarned = false;
let foundLogShown = false;
const MAX_POLL_ATTEMPTS = 10;
let pollAttempts = 0;
const _bound = new WeakSet();

const { debug } = getConfig();
const log = (...args) => debug && console.log('[Smoothr Cart]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Cart]', ...args);
const err = (...args) => debug && console.error('[Smoothr Cart]', ...args);

export function bindAddToCartButtons() {
  if (debug && !initLogShown) {
    log('🧩 bindAddToCartButtons loaded and executing');
    initLogShown = true;
  }
  if (typeof document === 'undefined') return;
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart?.addItem) {
    warn('cart module not found');
    return;
  }

  const selectors = [
    '[data-smoothr="add-to-cart"]',
    '#smoothr-add-to-cart',
    '.smoothr-add-to-cart',
    '[data-smoothr-add-to-cart]',
    '[data-smoothr-add]'
  ];
  const seen = new Set();
  const buttons = [];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((btn) => {
      if (!seen.has(btn)) {
        seen.add(btn);
        buttons.push(btn);
      }
    });
  });
  if (debug && !foundLogShown)
    log(`found ${buttons.length} [data-smoothr="add-to-cart"] elements`);
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
        `No [data-smoothr="add-to-cart"] elements after ${MAX_POLL_ATTEMPTS} attempts—feature disabled`
      );
      Smoothr.cart.addButtonPollingDisabled = true;
      return;
    }
    if (!noButtonsWarned) {
      warn('no buttons found; retrying...');
      noButtonsWarned = true;
    }
    setTimeout(bindAddToCartButtons, 500);
    return;
  }

    buttons.forEach(btn => {
      if (debug) log('🔗 binding [data-smoothr="add-to-cart"] button', btn);
      if (_bound.has(btn)) return;
      _bound.add(btn);

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
        if (typeof Smoothr.cart?.renderCart === 'function') {
          if (debug) log('🧼 Calling renderCart() to update UI');
          try {
            Smoothr.cart.renderCart();
          } catch (error) {
            warn('renderCart failed', error);
          }
        } else {
          warn('renderCart not found');
        }
      } catch (error) {
        err('addToCart failed', error);
      }
    });
  });
}
