// Smoothr Checkout Script for Webflow with integrated NMI
import { initCurrencyDom } from '../../core/currency/webflow-dom.js';
import { mountNMI } from '../../checkout/gateways/nmi.js';

async function initCheckout() {
  if (!window.SMOOTHR_CONFIG) {
    console.error('[Smoothr Checkout] Config not found');
    return;
  }
  console.log('[Smoothr Checkout] SDK initialized');
  console.log('[Smoothr Checkout] SMOOTHR_CONFIG', window.SMOOTHR_CONFIG);

  const gateway = window.SMOOTHR_CONFIG.active_payment_gateway;
  if (gateway === undefined) {
    console.warn(
      '[Smoothr Checkout] No active payment gateway configured'
    );
    return;
  }
  console.log('[Smoothr Checkout] Using gateway:', gateway);

  console.log(
    '[Smoothr Checkout] checkout trigger found',
    document.querySelector('[data-smoothr-pay]')
  );

  if (gateway === 'nmi') {
    try {
      await mountNMI();
    } catch (error) {
      console.error('[Smoothr Checkout] Failed to mount gateway', error);
    }
  }

  const payButton = document.querySelector('[data-smoothr-pay]');
  if (payButton) {
    console.log('[Smoothr Checkout] Pay div found and bound');
  } else {
    console.warn('[Smoothr Checkout] Pay div not found');
  }

  // Initialize shared DOM price formatter
  initCurrencyDom();
}

// Run init on load
document.addEventListener('DOMContentLoaded', initCheckout);

