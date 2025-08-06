export function getConfig() {
  if (typeof window !== 'undefined') {
    window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
    return window.SMOOTHR_CONFIG;
  }
  globalThis.SMOOTHR_CONFIG = globalThis.SMOOTHR_CONFIG || {};
  return globalThis.SMOOTHR_CONFIG;
}

export function mergeConfig(partial = {}) {
  const cfg = getConfig();
  Object.assign(cfg, partial);
  return cfg;
}
