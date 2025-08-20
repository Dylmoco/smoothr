import { initCurrencyDom } from './webflow/currencyDomAdapter.js';
import { getConfig } from '../features/config/globalConfig.js';

const legacyMap = {
  'data-smoothr-pay': 'pay',
  'data-smoothr-add': 'add-to-cart',
  'data-smoothr-remove': 'remove-from-cart',
  'data-smoothr-login': 'login',
  'data-smoothr-logout': 'logout',
  'data-smoothr-currency': 'currency',
  'data-smoothr-signup': 'signup',
  'data-smoothr-password-reset': 'password-reset',
  'data-smoothr-password-reset-confirm': 'password-reset-confirm',
  // Extra legacy conveniences for auth entry points:
  'data-smoothr-account': 'account-access',
  'data-smoothr-auth': 'auth-panel'
};

// Normalize unified auth trigger aliases:
// - prefer data-smoothr="auth" with optional data-smoothr-mode
// - keep account-access as alias for "auth" trigger
function normalizeUnifiedAuth(root = document) {
  // account-access → auth (trigger), preserve any mode attribute
  root.querySelectorAll('[data-smoothr="account-access"]').forEach(el => {
    if (el.getAttribute('data-smoothr') !== 'auth') {
      el.setAttribute('data-smoothr', 'auth');
    }
  });
}

function normalizeLegacyAttributes(root = document) {
  const debug = getConfig().debug;
  Object.entries(legacyMap).forEach(([legacyAttr, canonical]) => {
    root.querySelectorAll(`[${legacyAttr}]`).forEach((el) => {
      if (!el.hasAttribute('data-smoothr')) {
        el.setAttribute('data-smoothr', canonical);
        if (debug) {
          console.log(
            `[Smoothr Webflow] normalized ${legacyAttr} -> data-smoothr="${canonical}"`
          );
        }
      }
    });
  });
  // then normalize unified auth trigger aliases
  normalizeUnifiedAuth(root);
}

function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) normalizeLegacyAttributes(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return observer;
}

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
          normalizeLegacyAttributes();
          resolve();
        };

        if (document.readyState !== 'loading') {
          run();
        } else {
          document.addEventListener('DOMContentLoaded', run, { once: true });
        }
      }),
    observeDOMChanges,
  };
}

