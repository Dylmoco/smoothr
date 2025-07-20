export const SUPPORTED_GATEWAYS = ['stripe', 'authorizeNet', 'paypal', 'nmi', 'segpay'];

export default function resolveGateway(config = {}, storeSettings = {}) {
  const provider =
    config.active_payment_gateway ||
    storeSettings.active_payment_gateway;

  if (!provider) {
    throw new Error('active_payment_gateway not configured');
  }

  if (!SUPPORTED_GATEWAYS.includes(provider)) {
    throw new Error(`Unknown payment gateway: ${provider}`);
  }

  return provider;
}
