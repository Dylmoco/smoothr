// core/checkout.js

let stripeGatewayPromise;
export async function loadStripeGateway() {
  if (!stripeGatewayPromise) {
    stripeGatewayPromise = import('../checkout/gateways/stripe.js').then(
      m => m.default || m
    );
  }
  return stripeGatewayPromise;
}

export const checkout = await loadStripeGateway();

import * as abandonedCart from './abandoned-cart/index.js';
import * as affiliates from './affiliates/index.js';
import * as analytics from './analytics/index.js';
import * as cart from './cart.js';
import * as dashboard from './dashboard/index.js';
import * as discounts from './discounts/index.js';
import * as orders from './orders/index.js';
import * as returns from './returns/index.js';
import * as reviews from './reviews/index.js';
import * as subscriptions from './subscriptions/index.js';

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
      const gateway = await loadStripeGateway();
      return gateway?.mountCardFields
        ? gateway.mountCardFields(...args)
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

