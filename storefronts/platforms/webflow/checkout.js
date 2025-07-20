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

import { initCheckout } from '../../checkout/checkout.js';

export { initCheckout };

// ✅ DOM ready → retry until Smoothr.bootstrap is available, then run initCheckout
document.addEventListener('DOMContentLoaded', () => {
  const tryInit = () => {
    const boot = window.Smoothr?.bootstrap;
    if (typeof boot === 'function') {
      boot()
        .then(() => {
          initCheckout();
        })
        .catch((err) => {
          console.error('[Smoothr] Bootstrap failed:', err);
        });
    } else {
      console.log('[Smoothr] bootstrap not ready, retrying...');
      setTimeout(tryInit, 100);
    }
  };
  tryInit();
});
