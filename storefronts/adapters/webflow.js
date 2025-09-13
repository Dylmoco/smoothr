import { initCurrencyDom } from './webflow/currencyDomAdapter.js';
import { getConfig } from '../features/config/globalConfig.js';

const legacyMap = {
  'data-smoothr-pay': 'pay',
  'data-smoothr-add': 'add-to-cart',
  'data-smoothr-remove': 'remove-from-cart',
  'data-smoothr-login': 'login',
  'data-smoothr-logout': 'logout',
  'data-smoothr-currency': 'currency',
  'data-smoothr-signup': 'sign-up',
  'data-smoothr-password-reset': 'password-reset',
  'data-smoothr-password-reset-confirm': 'password-reset-confirm',
  // Extra legacy conveniences for auth entry points:
  'data-smoothr-account': 'account-access',
  'data-smoothr-auth': 'auth-pop-up',
  'data-smoothr-auth-panel': 'auth-pop-up',
  'data-smoothr-auth-popup': 'auth-pop-up',
  'data-smoothr-auth-dropdown': 'auth-drop-down',
  'data-smoothr-auth-drop-down': 'auth-drop-down'
};

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

export function domReady() {
  if (globalThis.__SMOOTHR_TEST_FAST_BOOT) {
    initCurrencyDom();
    normalizeLegacyAttributes();
    return Promise.resolve();
  }
  if (document.readyState !== 'loading') {
    initCurrencyDom();
    normalizeLegacyAttributes();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const onReady = () => {
      document.removeEventListener('DOMContentLoaded', onReady);
      initCurrencyDom();
      normalizeLegacyAttributes();
      resolve();
    };
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  });
}

export function initAdapter(config) {
  // Placeholder for future Webflow-specific setup using `config` if needed.
  return {
    domReady,
    observeDOMChanges,
  };
}

