import resolveGateway from '../../../core/utils/resolveGateway.js';
import { getStoreSettings } from '../gateways/stripe.js';

export default async function getActivePaymentGateway(log = () => {}, warn = () => {}) {
  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.active_payment_gateway) {
    return resolveGateway(cfg, {});
  }

  const storeId = cfg.storeId;
  if (!storeId) {
    throw new Error('Store ID missing');
  }

  const settings = await getStoreSettings(storeId);
  try {
    return resolveGateway(cfg, settings || {});
  } catch (e) {
    warn('Gateway resolution failed:', e?.message || e);
    throw e;
  }
}
