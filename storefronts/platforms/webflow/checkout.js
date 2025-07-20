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

// ✅ DOM ready → retry until Smoothr.bootstrap + SMOOTHR_CONFIG available
document.addEventListener('DOMContentLoaded', () => {
  let attempts = 0;
  const tryInit = () => {
    const ready =
      typeof window.Smoothr?.bootstrap === 'function' &&
      typeof window.SMOOTHR_CONFIG === 'object';

    if (ready) {
      window.Smoothr.bootstrap()
        .then(() => {
          initCheckout();
        })
        .catch((err) => {
          console.error('[Smoothr] Bootstrap failed:', err);
        });
    } else {
      if (attempts++ > 100) {
        console.warn('[Smoothr] bootstrap retry limit reached — aborting initCheckout');
        return;
      }
      console.log('[Smoothr] bootstrap not ready, retrying...');
      setTimeout(tryInit, 100);
    }
  };
  tryInit();
});
