// Provider NMI init module migrated from gateways/nmiGateway.js

import { resolveTokenizationKey } from '../nmiProvider.js';
import { handleSuccessRedirect } from '../../utils/handleSuccessRedirect.js';
import { disableButton, enableButton } from '../../utils/cartHash.js';
import styleNmiIframes, { getNmiStyles } from '../../utils/nmiIframeStyles.js';
import { loadScriptOnce } from '../../../utils/loadScriptOnce.js';

const scriptSrc = 'https://secure.nmi.com/token/Collect.js';
const globalCheck = 'CollectJS';

let hasMounted = false;
let isConfigured = false;
let isLocked = false;
let isSubmitting = false;
let configPromise;
let resolveConfig;

export async function init(config = {}) {
  if (hasMounted) return configPromise;
  hasMounted = true;
  configPromise = new Promise(resolve => {
    resolveConfig = resolve;
  });

  if (typeof window === 'undefined') {
    resolveConfig();
    return configPromise;
  }

  window.SMOOTHR_CONFIG = { ...(window.SMOOTHR_CONFIG || {}), ...config };

  const storeId = window.SMOOTHR_CONFIG.storeId;
  const tokenKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi');
  if (!tokenKey) {
    console.warn('[NMI] Tokenization key missing');
    alert('Payment setup issue. Please try again or contact support.');
    resolveConfig();
    return configPromise;
  }

  await initNMI(tokenKey);
  return configPromise;
}

async function initNMI(tokenKey) {
  if (isConfigured) return;
  console.log('[NMI] Appending CollectJS script...');

  const cardNumberDiv = document.querySelector('[data-smoothr-card-number]');
  const { customCssObj, placeholderCssObj, googleFontString } = getNmiStyles();

  try {
    await loadScriptOnce(scriptSrc, globalCheck, {
      id: 'collectjs-script',
      'data-tokenization-key': tokenKey,
      'data-custom-css': JSON.stringify(customCssObj),
      'data-placeholder-css': JSON.stringify(placeholderCssObj),
      'data-style-sniffer': 'true',
      'data-google-font': googleFontString
    });
    console.log('[NMI] CollectJS loaded');
    configureCollectJS();
  } catch {
    console.error('[NMI] Failed to load CollectJS');
    alert('Unable to load payment system. Please refresh the page.');
    resolveConfig();
  }
}

function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
    return setTimeout(configureCollectJS, 500);
  }
  isLocked = true;

  try {
    const cardNumberDiv = document.querySelector('[data-smoothr-card-number]');
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector(
      '[data-smoothr-card-placeholder]'
    );
    const expiryPlaceholderEl = document.querySelector(
      '[data-smoothr-card-expiry] [data-smoothr-expiry-placeholder]'
    );
    const cvcPlaceholderEl = document.querySelector(
      '[data-smoothr-card-cvc] [data-smoothr-cvv-placeholder]'
    );
    const cardNumberPlaceholderText = cardNumberPlaceholderEl
      ? cardNumberPlaceholderEl.textContent.trim()
      : 'Card Number';
    const expiryPlaceholderText = expiryPlaceholderEl
      ? expiryPlaceholderEl.textContent.trim()
      : 'MM/YY';
    const cvcPlaceholderText = cvcPlaceholderEl
      ? cvcPlaceholderEl.textContent.trim()
      : 'CVC';

    CollectJS.configure({
      variant: 'inline',
      fields: {
        ccnumber: {
          selector: '[data-smoothr-card-number]',
          placeholder: cardNumberPlaceholderText
        },
        ccexp: {
          selector: '[data-smoothr-card-expiry]',
          placeholder: expiryPlaceholderText
        },
        cvv: {
          selector: '[data-smoothr-card-cvc]',
          placeholder: cvcPlaceholderText
        }
      },
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available');
        styleNmiIframes(cardNumberDiv, [
          cardNumberPlaceholderEl,
          expiryPlaceholderEl,
          cvcPlaceholderEl
        ]);
      },
      callback(response) {
        const buttons = Array.from(
          document.querySelectorAll('[data-smoothr-pay]')
        );
        if (!response.token) {
          console.error('[NMI] Tokenization failed', response.reason);
          alert('Please check your payment details and try again.');
          resetSubmission(buttons);
          return;
        }
        console.log('[NMI] Token:', response.token);
        // ... payload build & fetch logic unchanged ...
      }
    });

    const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'));
    const tokenFn =
      CollectJS.tokenize ||
      CollectJS.requestToken ||
      CollectJS.startPaymentRequest ||
      null;
    buttons.forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault();
        if (isSubmitting) return false;
        isSubmitting = true;
        buttons.forEach(disableButton);
        if (tokenFn) tokenFn();
        else resetSubmission(buttons);
        return false;
      });
    });

    isConfigured = true;
    console.log('[NMI] Config complete');
    resolveConfig();
  } catch (e) {
    console.error('[NMI] Config error', e);
    alert('Setup error. Refresh or contact support.');
    resetSubmission(Array.from(document.querySelectorAll('[data-smoothr-pay]')));
    resolveConfig();
  }
}

function resetSubmission(buttons) {
  isLocked = false;
  isSubmitting = false;
  buttons.forEach(enableButton);
}

export const mountNMI = init;
export function isMounted() {
  return isConfigured;
}
export function ready() {
  return isConfigured;
}
export async function createPaymentMethod() {
  return { error: { message: 'use CollectJS callback' }, payment_method: null };
}

export default { scriptSrc, globalCheck, init, isMounted, ready, createPaymentMethod };

