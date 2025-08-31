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
    '/reset-password'
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
