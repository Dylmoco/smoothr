// core/checkout.js

// Lazy re-export of initCheckout to avoid bundling gateway code until used
export async function initCheckout(config) {
  const mod = await import('../checkout/checkout.js');
  return mod.initCheckout(config);
}

// Re-export utility for resolving active payment gateway
export { default as getActivePaymentGateway } from '../checkout/utils/resolveGateway.js';

// Re-export renderCart helper
import { renderCart } from './cart/renderCart.js';
export { renderCart };

// Helper to mount gateway specific iframes lazily
export async function renderGatewayIframe(provider, ...args) {
  switch (provider) {
    case 'stripe': {
      const mod = await import('../checkout/gateways/stripe.js');
      const gateway = mod.default || mod;
      if (gateway?.mountCardFields) {
        return gateway.mountCardFields(...args);
      }
      return gateway?.default?.mountCardFields
        ? gateway.default.mountCardFields(...args)
        : undefined;
    }
    case 'nmi': {
      const mod = await import('../checkout/gateways/nmi.js');
      const gateway = mod.default || mod;
      if (gateway?.mountCardFields) {
        return gateway.mountCardFields(...args);
      }
      return gateway?.default?.mountCardFields
        ? gateway.default.mountCardFields(...args)
        : undefined;
    }
    default:
      throw new Error(`Unsupported gateway: ${provider}`);
  }
}

