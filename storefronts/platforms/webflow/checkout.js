// Smoothr Checkout Script for Webflow with integrated NMI

import { mountNMIFields } from '../../checkout/gateways/nmi.js';

// (keep the async wrapper and rest as is)
export async function initCheckout() {
    if (!window.SMOOTHR_CONFIG) {
      console.error('[Smoothr Checkout] Config not found');
      return;
    }
    console.log('[Smoothr Checkout] SDK initialized');
    console.log('[Smoothr Checkout] SMOOTHR_CONFIG', window.SMOOTHR_CONFIG);

    const gateway = window.SMOOTHR_CONFIG.active_payment_gateway;
    console.log('[Smoothr Checkout] Using gateway:', gateway);

    console.log('[Smoothr Checkout] checkout trigger found', document.querySelector('[data-smoothr-checkout]'));

    if (gateway === 'nmi') {
      try {
        await mountNMIFields();
        console.log('[NMI] Fields mounted');
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
  }

  // Run init on load
  document.addEventListener('DOMContentLoaded', initCheckout);
