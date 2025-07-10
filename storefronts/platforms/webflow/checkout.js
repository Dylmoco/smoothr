import waitForElement from '../../checkout/utils/waitForElement.js';
export { initCheckout } from '../../checkout/checkout.js';

window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
window.SMOOTHR_CONFIG.platform = 'webflow';

async function init() {
  if (window.__SMOOTHR_CHECKOUT_INITIALIZED__) {
    console.warn('[Smoothr Checkout] Already initialized');
    return;
  }
  window.__SMOOTHR_CHECKOUT_INITIALIZED__ = true;
  await waitForElement('[data-smoothr-checkout]');
  const mod = await import('../../checkout/checkout.js');
  await mod.initCheckout(window.SMOOTHR_CONFIG);
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') {
  init();
}

