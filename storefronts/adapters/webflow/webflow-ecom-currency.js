// Smoothr Checkout Script for Webflow with integrated NMI
import { mountNMI } from '../../features/checkout/gateways/nmiGateway.js';
import { getConfig } from '../../features/config/globalConfig.js';

async function init() {
  const cfg = getConfig();
  const debug = Boolean(cfg.debug);
  if (debug) {
    console.log('[Smoothr Checkout] SDK initialized');
    console.log('[Smoothr Checkout] SMOOTHR_CONFIG', cfg);
  }

  const gateway = cfg.active_payment_gateway;
  if (gateway === undefined) {
    console.error('[Smoothr Checkout] No active payment gateway configured');
    return;
  }
  if (debug) console.log('[Smoothr Checkout] Using gateway:', gateway);

  if (debug)
    // TODO: Remove legacy [data-smoothr-pay] support once all projects are migrated.
    console.log(
      '[Smoothr Checkout] checkout trigger found',
      document.querySelector('[data-smoothr="pay"], [data-smoothr-pay]')
    );

  if (gateway === 'nmi') {
    try {
      await mountNMI();
    } catch (error) {
      console.error('[Smoothr Checkout] Failed to mount gateway', error);
    }
  }

  // TODO: Remove legacy [data-smoothr-pay] support once all projects are migrated.
  const payButton = document.querySelector('[data-smoothr="pay"], [data-smoothr-pay]');
  if (payButton) {
    if (debug) console.log('[Smoothr Checkout] Pay div found and bound');
  } else {
    console.error('[Smoothr Checkout] Pay div not found');
  }

}

// Run init on load
document.addEventListener('DOMContentLoaded', () => {
  if (getConfig().active_payment_gateway) {
    init();
  } else {
    console.error('[Smoothr Checkout] Skipping init — no active gateway');
  }
});

