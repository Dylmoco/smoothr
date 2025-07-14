// Smoothr Checkout Script for Webflow with integrated NMI

import { initNMI } from './gateways/nmi.js';

// ... rest of the code remains the same, but in initCheckout, call initNMI(tokenizationKey) instead of mountNMIFields
if (gateway === 'nmi') {
  try {
    const tokenizationKey = await fetchTokenizationKey(window.SMOOTHR_CONFIG.storeId);
    console.log('[NMI] NMI tokenization key fetched:', tokenizationKey.substring(0, 8) + '...');
    initNMI(tokenizationKey);
  } catch (error) {
    console.error('[Smoothr Checkout] Failed to mount gateway', error);
  }
}

// ... (keep the rest)