import resolveGateway from '../../../core/utils/resolveGateway.js';

export default function getActivePaymentGateway(log = () => {}, warn = () => {}) {
  const cfg = window.SMOOTHR_CONFIG || {};

  if (!cfg.active_payment_gateway) {
    const err = new Error('active_payment_gateway not configured');
    warn(err.message);
    throw err;
  }

  try {
    return resolveGateway(cfg);
  } catch (e) {
    warn('Gateway resolution failed:', e?.message || e);
    throw e;
  }
}
