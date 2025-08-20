import { getConfig } from '../config/globalConfig.js';

let initLogShown = false;
let foundLogShown = false;
const _bound = new WeakSet();
let observer;

const { debug } = getConfig();
const log = (...args) => debug && console.log('[Smoothr Cart]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Cart]', ...args);
const err = (...args) => debug && console.error('[Smoothr Cart]', ...args);

async function domReady() {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    await new Promise(resolve =>
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    );
  }
}

export async function bindAddToCartButtons() {
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

  await domReady();

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
    if (!observer && typeof MutationObserver === 'function') {
      observer = new MutationObserver((_, obs) => {
        if (document.querySelector('[data-smoothr="add-to-cart"]')) {
          obs.disconnect();
          observer = null;
          if (debug) log('🔁 late add-to-cart button detected, rebinding');
          bindAddToCartButtons();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      if (debug) log('👀 observing DOM for late add-to-cart buttons');
    }
    return;
  }

  buttons.forEach(btn => {
    if (_bound.has(btn)) return;
    _bound.add(btn);
    if (debug) log('🔗 binding [data-smoothr="add-to-cart"] button', { ...btn.dataset });

    btn.addEventListener('click', e => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (debug) log('🛒 Add to cart clicked:', { ...btn.dataset });
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
        if (debug) log('🧮 cart item count', Smoothr.cart.getCart().items.length);
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

