import { getPublicCredential } from '../getPublicCredential.js';

let fieldsMounted = false;
let mountPromise;
let scriptPromise;
let tokenizationKey;

const DEBUG = !!window.SMOOTHR_CONFIG?.debug;
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

function loadCollectJs(_tokenKey, wrapper) {
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
    let script = document.querySelector(
      'script[src*="secure.networkmerchants.com/token/Collect.js"]'
    );
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://secure.networkmerchants.com/token/Collect.js';
      (wrapper || document.head).appendChild(script);
      script.addEventListener('load', () => resolve());
    } else {
      script.addEventListener('load', () => resolve());
    }
  });
  return scriptPromise;
}

export async function mountNMIFields() {
  if (mountPromise) return mountPromise;
  if (fieldsMounted) return;

  mountPromise = (async () => {
    log('Mounting NMI fields');

    const numEl = document.querySelector('[data-smoothr-card-number]');
    const expEl = document.querySelector('[data-smoothr-card-expiry]');
    const cvvEl = document.querySelector('[data-smoothr-card-cvc]');
    if (!numEl || !expEl || !cvvEl) {
      warn('Card fields not found');
      return;
    }

    const key = await resolveTokenizationKey();
    if (!key) {
      warn('No tokenization key available for mounting');
      return;
    }

    [numEl, expEl, cvvEl].forEach(el =>
      el.setAttribute('data-tokenization-key', key)
    );

    const ensureHidden = (parent, collect) => {
      let el = parent.querySelector(`input[data-collect="${collect}"]`);
      if (!el) {
        el = document.createElement('input');
        el.type = 'hidden';
        el.setAttribute('data-collect', collect);
        parent.appendChild(el);
      }
      return el;
    };

    ensureHidden(numEl, 'cardNumber');
    ensureHidden(cvvEl, 'cvv');

    let vis = expEl.querySelector('input[data-smoothr-expiry-visible]');
    if (!vis) {
      vis = document.createElement('input');
      vis.setAttribute('data-smoothr-expiry-visible', '');
      vis.placeholder = 'MM / YY';
      expEl.appendChild(vis);
    }

    const injectHiddenExpiry = () => {
      ['expMonth', 'expYear'].forEach(name => {
        if (!expEl.querySelector(`input[data-collect="${name}"]`)) {
          const h = document.createElement('input');
          h.type = 'hidden';
          h.setAttribute('data-collect', name);
          expEl.appendChild(h);
        }
      });
    };

    vis.addEventListener('input', e => {
      if (/^\s*\d{2}\s*\/\s*\d{2}\s*$/.test(e.target.value)) {
        injectHiddenExpiry();
      }
    });

    const configure = () => {
      window.CollectJS.configure({
        tokenizationKey: key,
        fields: {
          cardNumber: document.querySelector('input[data-collect="cardNumber"]'),
          cvv: document.querySelector('input[data-collect="cvv"]'),
          expMonth: document.querySelector('input[data-collect="expMonth"]'),
          expYear: document.querySelector('input[data-collect="expYear"]')
        }
      });
    };

    if (!window.CollectJS) {
      const s = document.createElement('script');
      s.src = 'https://secure.networkmerchants.com/token/Collect.js';
      document.head.appendChild(s);
      s.onload = configure;
    } else {
      configure();
    }

    fieldsMounted = true;
    log('NMI fields mounted');
  })();

  mountPromise = mountPromise.finally(() => {
    mountPromise = null;
  });
  return mountPromise;
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
