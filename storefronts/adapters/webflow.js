import { initCurrencyDom } from './webflow/currencyDomAdapter.js';

export function initAdapter(config) {
  // Placeholder for future Webflow-specific setup using `config` if needed.
  return {
    domReady: () =>
      new Promise(resolve => {
        if (document.readyState !== 'loading') {
          initCurrencyDom();
          resolve();
        } else {
          document.addEventListener(
            'DOMContentLoaded',
            () => {
              initCurrencyDom();
              resolve();
            },
            { once: true }
          );
        }
      })
  };
}

