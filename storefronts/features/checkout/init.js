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

    const result = await (provider.init ? provider.init(config) : undefined);

    const checkoutFn =
      result?.checkout ||
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

