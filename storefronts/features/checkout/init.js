import { loadScriptOnce } from '../../utils/loadScriptOnce.js';

let initialized = false;

export async function init(config = {}) {
  if (initialized || (typeof window !== 'undefined' && window.Smoothr?.cart?.checkout)) {
    return;
  }
  initialized = true;

  if (typeof window === 'undefined') {
    return;
  }

  window.SMOOTHR_CONFIG = { ...(window.SMOOTHR_CONFIG || {}), ...config };

  const debug = !!window.SMOOTHR_CONFIG?.debug;
  const gateway = window.SMOOTHR_CONFIG?.settings?.active_payment_gateway;
  if (!gateway) {
    return;
  }

  try {
    const mod = await import(`./providers/${gateway}/init.js`);
    const provider = mod.default || mod;

    const scriptSrc =
      provider.scriptSrc ||
      provider.sdkSrc ||
      provider.src ||
      provider.sdk?.src;
    const globalCheck =
      provider.global ||
      provider.globalVar ||
      provider.sdk?.global ||
      provider.globalCheck;

    if (scriptSrc) {
      await loadScriptOnce(scriptSrc, globalCheck);
    }

    const checkoutFn =
      provider.checkout ||
      (provider.default && provider.default.checkout);

    window.Smoothr = window.Smoothr || {};
    const cart = (window.Smoothr.cart = window.Smoothr.cart || {});
    if (typeof checkoutFn === 'function') {
      cart.checkout = checkoutFn;
    }

    if (debug) {
      console.log('[Smoothr] Checkout module loaded');
      console.log('[Smoothr] Active gateway:', gateway);
    }
  } catch (e) {
    if (debug) {
      console.warn('[Smoothr] Failed to load provider module', gateway, e);
    }
  }
}

