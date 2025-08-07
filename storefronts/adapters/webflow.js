import { initCurrencyDom } from './webflow/currencyDomAdapter.js';
import { getConfig } from '../features/config/globalConfig.js';

export function initAdapter(config) {
  // Placeholder for future Webflow-specific setup using `config` if needed.
  return {
    domReady: () =>
      new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (getConfig().debug)
            console.warn('[Smoothr Webflow] DOM ready timeout');
          reject(new Error('DOM ready timeout'));
        }, 5000);

        const run = () => {
          clearTimeout(timeoutId);
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

