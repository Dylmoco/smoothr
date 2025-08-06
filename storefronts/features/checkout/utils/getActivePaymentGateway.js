import resolveGateway from './resolveGateway.js';
import { getConfig } from '../../config/globalConfig.js';

export default function getActivePaymentGateway(log = () => {}, warn = () => {}) {
  const cfg = getConfig();

  if (!cfg.active_payment_gateway) {
    warn('active_payment_gateway not configured');
    return null;
  }

  try {
    return resolveGateway(cfg);
  } catch (e) {
    warn('Gateway resolution failed:', e?.message || e);
    return null;
  }
}
