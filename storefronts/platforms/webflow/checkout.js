;(function addNmiPerformanceHints() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__NMI_PERF_HINTS__) return;
  window.__NMI_PERF_HINTS__ = true;

  const head = document.head || document.getElementsByTagName('head')[0];
  const origin = 'https://secure.nmi.com';
  const script = `${origin}/token/Collect.js`;

  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = origin;
  head.appendChild(dnsPrefetch);

  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = origin;
  preconnect.crossOrigin = 'anonymous';
  head.appendChild(preconnect);

  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.href = script;
  preload.as = 'script';
  head.appendChild(preload);

  try {
    fetch(script, { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
  } catch {}

  console.log('[NMI] performance hints injected');
})();

import { initCheckout } from '../core/checkout.js';

export { initCheckout };

// ✅ Set platform
window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
window.SMOOTHR_CONFIG.platform = 'webflow-ecom';

const waitForStoreId = () => {
  const config = window.SMOOTHR_CONFIG;
  if (config?.storeId) {
    if (window.SMOOTHR_CONFIG?.active_payment_gateway) {
      console.log('[Smoothr] initCheckout ready — mounting');
      initCheckout();
    } else {
      console.warn(
        '[Smoothr Checkout] Skipping initCheckout — no active gateway'
      );
    }
  } else {
    console.log('[Smoothr] Waiting for storeId...');
    setTimeout(waitForStoreId, 50);
  }
};

// ✅ Always run waitForStoreId on SDK ready
window.addEventListener('smoothr:ready', waitForStoreId);

// ✅ Also run it immediately in case SDK already fired
waitForStoreId();
