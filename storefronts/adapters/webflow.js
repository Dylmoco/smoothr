import { initCurrencyDom } from './webflow/currencyDomAdapter.js';

export function initAdapter(config) {
  // Placeholder for future Webflow-specific setup using `config` if needed.
  return {
    domReady: () =>
      new Promise(resolve => {
        const run = () => {
          initCurrencyDom();
          resolve();
        };

        if (document.readyState !== 'loading') {
          run();
        } else {
          document.addEventListener('DOMContentLoaded', run, { once: true });
        }
      })
  };
}

