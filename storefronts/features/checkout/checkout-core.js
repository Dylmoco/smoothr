// core/checkout.js

let stripeGatewayPromise;
export async function loadStripeGateway() {
  if (!stripeGatewayPromise) {
    stripeGatewayPromise = import('./gateways/stripe.js').then(
      m => m.default || m
    );
  }
  return stripeGatewayPromise;
}

export const checkout = await loadStripeGateway();

import * as abandonedCart from '../../core/abandoned-cart/index.js';
import * as affiliates from '../../core/affiliates/index.js';
import * as analytics from '../../core/analytics/index.js';
import * as cart from '../../core/cart.js';
import * as dashboard from '../../core/dashboard/index.js';
import * as discounts from '../../core/discounts/index.js';
import * as orders from '../../core/orders/index.js';
import * as returns from '../../core/returns/index.js';
import * as reviews from '../../core/reviews/index.js';
import * as subscriptions from '../../core/subscriptions/index.js';

// Lazy re-export of initCheckout to avoid bundling gateway code until used
export async function initCheckout(config) {
  const mod = await import('./initCheckout.js');
  return mod.initCheckout(config);
}

// Re-export utility for resolving active payment gateway
export { default as getActivePaymentGateway } from './utils/resolveGateway.js';

// Re-export renderCart helper
import { renderCart } from '../../core/cart/renderCart.js';
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
      const mod = await import('./gateways/nmi.js');
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

