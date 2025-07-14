// Smoothr Checkout Script for Webflow with integrated NMI

import { initNMI } from './gateways/nmi.js';

(async function () {
  async function initCheckout() {
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
        const tokenizationKey = await fetchTokenizationKey(window.SMOOTHR_CONFIG.storeId);
        console.log('[NMI] NMI tokenization key fetched:', tokenizationKey.substring(0, 8) + '...');
        initNMI(tokenizationKey);
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

  // Fetch key via Next.js API to bypass RLS
  async function fetchTokenizationKey(storeId) {
    const apiBase = window.SMOOTHR_CONFIG.apiBase;
    const response = await fetch(`${apiBase}/api/get-payment-key?storeId=${storeId}&provider=nmi`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`API fetch error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.tokenization_key) {
      return data.tokenization_key;
    } else {
      throw new Error('No NMI key found');
    }
  }

  // Run init on loadd
  document.addEventListener('DOMContentLoaded', initCheckout);
})();