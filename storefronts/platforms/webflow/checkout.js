// Smoothr Checkout Script for Webflow with integrated NMI

import { mountNMI } from '../../checkout/gateways/nmi.js';
import { validateDiscount } from '../../core/discounts.ts';
import * as cart from '../../core/cart.js';
import { showError, showSuccess } from '../../../supabase/authHelpers.js';

export async function initCheckout() {
    if (!window.SMOOTHR_CONFIG) {
      console.error('[Smoothr Checkout] Config not found');
      return;
    }
    console.log('[Smoothr Checkout] SDK initialized');
    console.log('[Smoothr Checkout] SMOOTHR_CONFIG', window.SMOOTHR_CONFIG);

    const gateway = window.SMOOTHR_CONFIG.active_payment_gateway;
    console.log('[Smoothr Checkout] Using gateway:', gateway);

    console.log('[Smoothr Checkout] checkout trigger found', document.querySelector('[data-smoothr-pay]'));

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

    const discountInput = document.querySelector('[data-smoothr-discount]');
    if (discountInput) {
      discountInput.addEventListener('change', async e => {
        const code = e.target.value.trim();
        const form = discountInput.closest('form') || document;
        const discount = await validateDiscount(code);
        if (discount) {
          showSuccess(form, 'Discount applied');
          cart.applyDiscount({ code, type: discount.type, amount: discount.amount });
          if (cart.setMetaField) cart.setMetaField('discount_code', code);
          if (typeof window.renderCart === 'function') window.renderCart();
        } else {
          cart.applyDiscount(null);
          showError(form, 'Invalid discount code', discountInput);
        }
      });
    }
}

// Run init on load
document.addEventListener('DOMContentLoaded', initCheckout);