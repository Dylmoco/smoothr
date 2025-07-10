import { initCheckout } from '../../checkout/checkout.js';

window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
if (!window.SMOOTHR_CONFIG.platform) {
  window.SMOOTHR_CONFIG.platform = 'webflow';
}

document.addEventListener('DOMContentLoaded', initCheckout);
if (document.readyState !== 'loading') initCheckout();
