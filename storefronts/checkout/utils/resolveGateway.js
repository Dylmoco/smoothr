import resolveGateway from '../../../core/utils/resolveGateway.js';
import { loadPublicConfig } from '../../core/config.ts';

export default async function getActivePaymentGateway(log = () => {}, warn = () => {}) {
  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.active_payment_gateway) {
    return resolveGateway(cfg, {});
  }

  const storeId = cfg.storeId;
  if (!storeId) {
    throw new Error('Store ID missing');
  }

  const settings = await loadPublicConfig(storeId);
  try {
    return resolveGateway(cfg, settings || {});
  } catch (e) {
    warn('Gateway resolution failed:', e?.message || e);
    throw e;
  }
}
