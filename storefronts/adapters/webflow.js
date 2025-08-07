import { initCurrencyDom } from './webflow/currencyDomAdapter.js';
import { getConfig } from '../features/config/globalConfig.js';

export function initAdapter(config) {
  // Placeholder for future Webflow-specific setup using `config` if needed.

  const normalizeLegacyAttributes = () => {
    const mapping = {
      'data-smoothr-pay': 'pay',
      'data-smoothr-add': 'add-to-cart',
      'data-smoothr-remove': 'remove-from-cart',
      'data-smoothr-login': 'login',
      'data-smoothr-logout': 'logout',
      'data-smoothr-currency': 'currency'
    };

    Object.entries(mapping).forEach(([legacyAttr, canonical]) => {
      document.querySelectorAll(`[${legacyAttr}]`).forEach((el) => {
        if (!el.hasAttribute('data-smoothr')) {
          el.setAttribute('data-smoothr', canonical);
        }
      });
    });
  };

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
          normalizeLegacyAttributes();
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

