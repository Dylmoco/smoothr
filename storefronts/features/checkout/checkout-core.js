// core/checkout.js

let stripeGatewayPromise;
export async function loadStripeGateway() {
  if (!stripeGatewayPromise) {
    stripeGatewayPromise = import('./gateways/stripeGateway.js').then(
      m => m.default || m
    );
  }
  return stripeGatewayPromise;
}

export const checkout = await loadStripeGateway();

import * as abandonedCart from '../../features/abandoned-cart/index.js';
import * as affiliates from '../../features/affiliates/index.js';
import * as analytics from '../../features/analytics/index.js';
import * as cart from '../cart/index.js';
import * as dashboard from '../../features/dashboard/index.js';
import * as discounts from '../../features/discounts/index.js';
import * as orders from '../../features/orders/index.js';
import * as returns from '../../features/returns/index.js';
import * as reviews from '../../features/reviews/index.js';
import * as subscriptions from '../../features/subscriptions/index.js';

// Lazy re-export of init to avoid bundling gateway code until used
export async function init(config) {
  const mod = await import('./init.js');
  return mod.init(config);
}

// Backward compatibility
export async function initCheckout(config) {
  return init(config);
}

// Re-export utility for resolving active payment gateway
export { default as getActivePaymentGateway } from './utils/getActivePaymentGateway.js';

// Re-export renderCart helper
import { renderCart } from '../../features/cart/renderCart.js';
export { renderCart };

// Helper to mount gateway specific iframes lazily
export async function renderGatewayIframe(provider, ...args) {
  switch (provider) {
    case 'stripe': {
      const gateway = await loadStripeGateway();
      return gateway?.mountCardFields
        ? gateway.mountCardFields(...args)
        : undefined;
    }
    case 'nmi': {
      const mod = await import('./gateways/nmiGateway.js');
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

export {
  abandonedCart,
  affiliates,
  analytics,
  cart,
  dashboard,
  discounts,
  orders,
  returns,
  reviews,
  subscriptions
};

