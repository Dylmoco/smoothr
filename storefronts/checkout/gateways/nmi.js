import { getPublicCredential } from '../getPublicCredential.js';

let fieldsMounted = false;
let mountPromise;
let scriptPromise;
let tokenizationKey;
let wrapperKeySet = false;
let expiryInputsInjected = false;
let visibleAndHiddenLogged = false;

const DEBUG = true; // enable console logs for troubleshooting
const log = (...a) => DEBUG && console.log('[NMI]', ...a);
const warn = (...a) => DEBUG && console.warn('[NMI]', ...a);



async function resolveTokenizationKey() {
  if (tokenizationKey !== undefined) return tokenizationKey;
  const storeId = window.SMOOTHR_CONFIG?.storeId;
  if (!storeId) return null;

  const gateway = window.SMOOTHR_CONFIG?.active_payment_gateway || 'nmi';

  try {
    const cred = await getPublicCredential(storeId, 'nmi', gateway);
    tokenizationKey = cred?.settings?.tokenization_key || null;
  } catch (e) {
    warn('Integration fetch error:', e?.message || e);
    tokenizationKey = null;
  }

  if (!tokenizationKey) {
    warn('No tokenization key found for gateway', gateway);
    return null;
  }

  log('Using tokenization key resolved');
  return tokenizationKey;
}

function loadCollectJs(tokenKey, wrapper) {
  if (window.CollectJS) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    window.CollectJS = {
      configure: () => {},
      tokenize: cb => cb && cb({ token: 'tok_test' })
    };
    return Promise.resolve();
  }
  scriptPromise = new Promise(resolve => {
    let script = document.querySelector('script[data-tokenization-key]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://secure.networkmerchants.com/token/Collect.js';
      if (tokenKey) script.setAttribute('data-tokenization-key', tokenKey);
      (wrapper || document.head).appendChild(script);
      script.addEventListener('load', () => resolve());
    } else {
      script.addEventListener('load', () => resolve());
    }
  });
  return scriptPromise;
}

export async function mountNMIFields() {
  const wrapper = document.querySelector('[data-smoothr-nmi-wrapper]');
  if (!wrapper) return;

  wrapper.setAttribute('data-tokenization-key', tokenizationKey);

  if (!wrapper.querySelector('[data-smoothr-card-expiry]')) {
    const vis = document.createElement('input');
    vis.setAttribute('data-smoothr-card-expiry', '');
    vis.placeholder = 'MM / YY';
    wrapper.appendChild(vis);
  }

  ['expMonth', 'expYear'].forEach(name => {
    if (!wrapper.querySelector(`[data-collect="${name}"]`)) {
      const hid = document.createElement('input');
      hid.type = 'hidden';
      hid.setAttribute('data-collect', name);
      wrapper.appendChild(hid);
    }
  });

  if (!window.CollectJS) {
    const script = document.createElement('script');
    script.src = 'https://secure.networkmerchants.com/token/Collect.js';
    script.setAttribute('data-tokenization-key', tokenizationKey);
    document.head.appendChild(script);
    script.onload = configureCollect;
  } else {
    configureCollect();
  }
}

function configureCollect() {
  const wrapper = document.querySelector('[data-smoothr-nmi-wrapper]');
  const fields = {};
  wrapper.querySelectorAll('[data-collect]').forEach(el => {
    fields[el.getAttribute('data-collect')] = el;
  });
  window.CollectJS.configure({ fields, tokenizationKey: tokenizationKey });
}

export function isMounted() {
  const number = document.querySelector('[data-collect="cardNumber"]');
  const cvc = document.querySelector('[data-collect="cvv"]');
  const expiryVisible =
    document.querySelector(
      '[data-smoothr-card-expiry] input[data-smoothr-expiry-visible]'
    ) ||
    document.querySelector(
      '[data-smoothr-card-expiry] input:not([data-collect])'
    ) ||
    document.querySelector('[data-smoothr-card-expiry] input');
  return !!number && !!cvc && !!expiryVisible;
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

  const expiryEl =
    document.querySelector('[data-smoothr-card-expiry]')?.querySelector('input[data-smoothr-expiry-visible]') ||
    document.querySelector('[data-smoothr-card-expiry]')?.querySelector('input') ||
    document.querySelector('[data-smoothr-card-expiry]');
  const expiryRaw = expiryEl?.value || '';
  const match = expiryRaw.replace(/\s+/g, '').match(/^(\d{1,2})\/?(\d{2,4})$/);

  if (!match) {
    warn('Invalid expiry format:', expiryRaw);
    return { error: { message: 'Invalid card expiry' }, payment_method: null };
  }

  let [, month, year] = match;
  if (month.length === 1) month = '0' + month;
  if (year.length === 2) year = '20' + year;
  const expMonth = month;
  const expYear = year;

  log('Parsed expiry', { expMonth, expYear });

  return new Promise(resolve => {
    try {
      window.CollectJS.tokenize({ expMonth, expYear }, response => {
        log('Tokenize response', response);
        if (response && response.token) {
          resolve({ error: null, payment_method: { payment_token: response.token } });
        } else {
          const message = response?.error || 'Tokenization failed';
          resolve({ error: { message }, payment_method: null });
        }
      });
    } catch (e) {
      resolve({ error: { message: e?.message || 'Tokenization failed' }, payment_method: null });
    }
  });
}

export { mountNMIFields as mountCardFields };

export default {
  mountCardFields: mountNMIFields,
  isMounted,
  ready,
  createPaymentMethod
};
