import { resolveTokenizationKey } from '../providers/nmi.js';
import waitForElement from '../utils/waitForElement.js';

let tokenizationKey;
let cardNumberInput;
let expiryInput;
let cvcInput;

const DEBUG = !!window.SMOOTHR_CONFIG?.debug;
const log = (...a) => DEBUG && console.log('[NMI]', ...a);
const warn = (...a) => DEBUG && console.warn('[NMI]', ...a);

function waitForCollectJsReady(callback, retries = 10) {
  if (window.CollectJS) {
    callback();
    return;
  }
  if (retries <= 0) {
    warn('Collect.js not found');
    return;
  }
  setTimeout(() => waitForCollectJsReady(callback, retries - 1), 100);
}




function parseExpiry(val) {
  const m = val.trim().match(/^(\d{1,2})\s*\/\s*(\d{2})$/);
  if (!m) return [null, null];
  let [, mon, yr] = m;
  if (mon.length === 1) mon = '0' + mon;
  return [mon, '20' + yr];
}

function syncHiddenExpiryFields(container, mon, yr) {
  let mm = container.querySelector('input[data-collect="expMonth"]');
  let yy = container.querySelector('input[data-collect="expYear"]');
  if (!mm) {
    mm = document.createElement('input');
    mm.type = 'hidden';
    mm.setAttribute('data-collect', 'expMonth');
    container.appendChild(mm);
  }
  if (!yy) {
    yy = document.createElement('input');
    yy.type = 'hidden';
    yy.setAttribute('data-collect', 'expYear');
    container.appendChild(yy);
  }
  mm.value = mon;
  yy.value = yr;
}

export async function mountNMIFields() {
  tokenizationKey = await resolveTokenizationKey();
  if (!tokenizationKey) return;

  const numEl = await waitForElement('[data-smoothr-card-number]');
  const expEl = await waitForElement('[data-smoothr-card-expiry]');
  const cvvEl = await waitForElement('[data-smoothr-card-cvc]');
  const postalEl = document.querySelector('[data-smoothr-postal]');
  if (!numEl || !expEl || !cvvEl) return;

  // Tag containers with the tokenization key (postal not required)
  [numEl, expEl, cvvEl].forEach(el =>
    el.setAttribute('data-tokenization-key', tokenizationKey)
  );

  // Remove any stale hidden expiry fields
  expEl.querySelectorAll('input[data-collect="expMonth"],input[data-collect="expYear"]')
    .forEach(i => i.remove());
  syncHiddenExpiryFields(expEl, '', '');

  function ensureSingleInput(el, dataCollectType) {
    let input = el.querySelector(`input[data-collect="${dataCollectType}"]`);
    if (!input) {
      input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('data-collect', dataCollectType);
      el.innerHTML = '';
      el.appendChild(input);
    }
    return input;
  }

  cardNumberInput = ensureSingleInput(numEl, 'cardNumber');
  expiryInput = ensureSingleInput(expEl, 'expiry');
  cvcInput = ensureSingleInput(cvvEl, 'cvv');

  // Inject hidden postal
  if (postalEl && !postalEl.querySelector('input[data-collect="postal"]')) {
    const i = document.createElement('input');
    i.type = 'hidden';
    i.setAttribute('data-collect', 'postal');
    postalEl.appendChild(i);
  }

  // On keyup, sync or remove hidden expiry fields
  expiryInput.addEventListener('keyup', e => {
    const [mon, yr] = parseExpiry(e.target.value);
    if (mon && yr) {
      syncHiddenExpiryFields(expEl, mon, yr);
    } else {
      expEl.querySelectorAll(
        'input[data-collect="expMonth"],input[data-collect="expYear"]'
      ).forEach(i => i.remove());
    }
  });

  // Load and configure Collect.js only once
  const setupCollect = () =>
    waitForCollectJsReady(() => {
      window.CollectJS.configure({
        tokenizationKey,
        fields: {
          cardNumber: cardNumberInput,
          expiry: expiryInput,
          cvv: cvcInput
        }
      });
    });
  if (!window.CollectJS) {
    let script = document.querySelector(
      'script[src*="secure.networkmerchants.com/token/Collect.js"],script[src*="secure.nmi.com/token/Collect.js"]'
    );
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://secure.nmi.com/token/Collect.js';
      script.setAttribute('data-tokenization-key', tokenizationKey);
      document.head.appendChild(script);
    }
    script.addEventListener('load', setupCollect);
  } else {
    setupCollect();
  }
}

export function isMounted() {
  const numberInput = document.querySelector('input[data-collect="cardNumber"]');
  const cvcInput = document.querySelector('input[data-collect="cvv"]');
  const monthInput = document.querySelector('input[data-collect="expMonth"]');
  const yearInput = document.querySelector('input[data-collect="expYear"]');

  const numberFrame = document.querySelector('[data-smoothr-card-number] iframe');
  const expiryFrame = document.querySelector('[data-smoothr-card-expiry] iframe');
  const cvcFrame = document.querySelector('[data-smoothr-card-cvc] iframe');

  return (
    !!window.CollectJS &&
    !!numberInput &&
    !!cvcInput &&
    !!monthInput &&
    !!yearInput &&
    !!numberFrame &&
    !!expiryFrame &&
    !!cvcFrame
  );
}

export function ready() {
  const number = document.querySelector('[data-collect="cardNumber"]');
  const cvc = document.querySelector('[data-collect="cvv"]');
  const month = document.querySelector(
    '[data-smoothr-card-expiry] input[data-collect="expMonth"]'
  );
  const year = document.querySelector(
    '[data-smoothr-card-expiry] input[data-collect="expYear"]'
  );
  const wrapper = document.querySelector('[data-tokenization-key]');
  const key = wrapper?.getAttribute('data-tokenization-key') || tokenizationKey;
  return (
    !!window.CollectJS &&
    !!key &&
    !!number &&
    !!cvc &&
    !!month &&
    !!year
  );
}

export async function createPaymentMethod() {
  if (!ready()) {
    return { error: { message: 'Collect.js not ready' }, payment_method: null };
  }

  return new Promise(resolve => {
    let handled = false;

    window.CollectJS.configure({
      tokenizationKey,
      fields: {
        cardNumber: cardNumberInput,
        expiry: expiryInput,
        cvv: cvcInput
      },
      callback(response) {
        if (handled) return;
        handled = true;

        if (response && response.token) {
          log('Token received from CollectJS callback:', response);
          resolve({ error: null, payment_method: { payment_token: response.token } });
        } else {
          log('Tokenization error from CollectJS:', response?.error || response);
          resolve({ error: response?.error || 'Unknown error', payment_method: null });
        }
      }
    });

    // NOTE: Collect.js internally listens for form submission or field blur events
    // No need to call anything — the iframe handles triggering
  });
}

export { mountNMIFields as mountCardFields };

export default {
  mountCardFields: mountNMIFields,
  isMounted,
  ready,
  createPaymentMethod
};

if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {};
  window.Smoothr.mountNMIFields = mountNMIFields;
}
