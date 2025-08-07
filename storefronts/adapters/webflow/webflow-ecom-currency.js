// Smoothr Checkout Script for Webflow with integrated NMI
import { mountNMI } from '../../features/checkout/gateways/nmiGateway.js';

async function init() {
  if (!window.SMOOTHR_CONFIG) {
    console.error('[Smoothr Checkout] Config not found');
    return;
  }
  const debug = Boolean(window.SMOOTHR_CONFIG?.debug);
  if (debug) {
    console.log('[Smoothr Checkout] SDK initialized');
    console.log('[Smoothr Checkout] SMOOTHR_CONFIG', window.SMOOTHR_CONFIG);
  }

  const gateway = window.SMOOTHR_CONFIG.active_payment_gateway;
  if (gateway === undefined) {
    console.error('[Smoothr Checkout] No active payment gateway configured');
    return;
  }
  if (debug) console.log('[Smoothr Checkout] Using gateway:', gateway);

  if (debug)
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
    if (debug) console.log('[Smoothr Checkout] Pay div found and bound');
  } else {
    console.error('[Smoothr Checkout] Pay div not found');
  }

}

// Run init on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.SMOOTHR_CONFIG?.active_payment_gateway) {
    init();
  } else {
    console.error('[Smoothr Checkout] Skipping init — no active gateway');
  }
});

