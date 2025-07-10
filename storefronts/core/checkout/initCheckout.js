import gatewayLoaders from './gatewayLoaders.js';
import getActivePaymentGateway from './getGateway.js';
import getPublicCredential from './getPublicCredential.js';

export default async function initCheckout() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
  const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);

  const provider = await getActivePaymentGateway(log, warn);
  let loader = gatewayLoaders[provider];
  if (!loader) {
    warn(`Unknown payment gateway: ${provider}; falling back to stripe`);
    loader = gatewayLoaders.stripe;
  }
  const gateway = (await loader()).default;

  if (provider === 'stripe') {
    let stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
    if (!stripeKey) {
      const storeId = window.SMOOTHR_CONFIG?.storeId;
      const cred = await getPublicCredential(storeId, 'stripe');
      stripeKey = cred?.api_key || cred?.settings?.publishable_key || '';
      if (stripeKey) window.SMOOTHR_CONFIG.stripeKey = stripeKey;
    }
    log(`stripeKey: ${stripeKey}`);
    if (!stripeKey) {
      warn('❌ Failed at Stripe Key Check: missing key');
      return { provider, gateway: null };
    }
    log('Stripe key confirmed');
  }

  return { provider, gateway };
}
