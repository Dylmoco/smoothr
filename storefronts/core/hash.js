import { getResetRoute } from './platformRoutes.js';

export function hasRecoveryHash() {
  const h = (location.hash || '').slice(1);
  return /(^|&)(access_token|refresh_token)=/.test(h);
}

export function stripHash() {
  try { history.replaceState?.(null, '', location.pathname + location.search); } catch {}
}

export function resetPath() {
  return (
    (window.SMOOTHR_CONFIG &&
      window.SMOOTHR_CONFIG.routes &&
      window.SMOOTHR_CONFIG.routes.resetPassword) ||
    getResetRoute()
  );
}

export function isOnResetRoute() {
  return location.pathname === resetPath();
}

// New: ensure normal pages never carry recovery tokens
export function stripRecoveryHashIfNotOnReset() {
  if (hasRecoveryHash() && !isOnResetRoute()) {
    stripHash();
  }
}

export function parseAuthHash() {
  try {
    if (!location.hash || location.hash.length < 2) return {};
    const params = new URLSearchParams(location.hash.slice(1));
    return {
      access_token: params.get('access_token') || '',
      type: params.get('type') || '',
      store_id: params.get('store_id') || '',
    };
  } catch {
    return {};
  }
}
