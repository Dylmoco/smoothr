export default {
  stripe: () => import('../../checkout/gateways/stripe.js'),
  authorizeNet: () => import('../../checkout/gateways/authorizeNet.js'),
  paypal: () => import('../../checkout/gateways/paypal.js'),
  nmi: () => import('../../checkout/gateways/nmi.js'),
  segpay: () => import('../../checkout/gateways/segpay.js')
};
