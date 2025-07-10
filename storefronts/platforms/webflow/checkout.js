import waitForElement from '../../checkout/utils/waitForElement.js';
export { initCheckout } from '../../checkout/checkout.js';

window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
window.SMOOTHR_CONFIG.platform = 'webflow';

export async function waitForCheckoutDom(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const checkout = document.querySelector('[data-smoothr-checkout]');
    const cardNumber = document.querySelector('[data-smoothr-card-number]');
    const submit = document.querySelector('[data-smoothr-submit]');
    if (checkout && cardNumber && submit) {
      return { checkout, cardNumber, submit };
    }
    await new Promise(r => setTimeout(r, 100));
  }
  return null;
}

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

