import { getPublicCredential } from '../getPublicCredential.js';

let fieldsMounted = false;
let mountPromise;
let scriptPromise;
let tokenizationKey;

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

function loadCollectJs(key) {
  if (window.CollectJS) {
    if (key && window.CollectJS.configure) {
      try {
        window.CollectJS.configure({ tokenizationKey: key });
      } catch (e) {
        warn('CollectJS.configure failed', e);
      }
    }
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    window.CollectJS = {
      configure: () => {},
      tokenize: cb => cb && cb({ token: 'tok_test' })
    };
    return Promise.resolve();
  }
  scriptPromise = new Promise(resolve => {
    let script = document.querySelector('script[data-smoothr-collect]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://secure.networkmerchants.com/token/Collect.js';
      script.type = 'text/javascript';
      script.setAttribute('data-smoothr-collect', '');
      script.addEventListener('load', () => {
        if (window.CollectJS?.configure && key) {
          try {
            window.CollectJS.configure({ tokenizationKey: key });
          } catch (e) {
            warn('CollectJS.configure failed', e);
          }
        }
        resolve();
      });
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => {
        if (window.CollectJS?.configure && key) {
          try {
            window.CollectJS.configure({ tokenizationKey: key });
          } catch (e) {
            warn('CollectJS.configure failed', e);
          }
        }
        resolve();
      });
    }
  });
  return scriptPromise;
}

export async function mountNMIFields() {
  if (mountPromise) return mountPromise;
  if (fieldsMounted) return;

  mountPromise = (async () => {
    log('Mounting NMI fields');
    let num;
    let exp;
    let cvc;
    let delay = 100;
    let waited = 0;
    while (waited < 5000) {
      num = document.querySelector('[data-smoothr-card-number]');
      exp = document.querySelector('[data-smoothr-card-expiry]');
      cvc = document.querySelector('[data-smoothr-card-cvc]');
      if (num && exp) break;
      await new Promise(res => setTimeout(res, delay));
      waited += delay;
      delay = Math.min(delay * 2, 1000);
    }

    if (!num || !exp) {
      warn('Card fields not found');
      return;
    }

    const key = await resolveTokenizationKey();

    if (key) {
      if (num) num.setAttribute('data-tokenization-key', key);
      if (exp) exp.setAttribute('data-tokenization-key', key);
      if (cvc) cvc.setAttribute('data-tokenization-key', key);
    } else {
      warn('No tokenization key available for mounting');
    }

    ['card-number', 'card-expiry', 'card-cvc'].forEach(field => {
      const el = document.querySelector(`[data-smoothr-card-${field}]`);
      if (el && !el.hasAttribute('data-tokenization-key')) {
        console.warn(`[NMI AUDIT] Missing tokenization key on field: ${field}`);
      }
    });

    await loadCollectJs(key);

    if (num && !num.getAttribute('data-collect'))
      num.setAttribute('data-collect', 'ccnumber');
    if (exp && !exp.getAttribute('data-collect'))
      exp.setAttribute('data-collect', 'ccexp');
    if (cvc && !cvc.getAttribute('data-collect'))
      cvc.setAttribute('data-collect', 'cvv');

    fieldsMounted = true;
    log('NMI fields mounted');
  })();

  mountPromise = mountPromise.finally(() => {
    mountPromise = null;
  });
  return mountPromise;
}

export function isMounted() {
  return fieldsMounted;
}

export function ready() {
  return fieldsMounted && !!window.CollectJS;
}

export async function createPaymentMethod() {
  if (!ready()) {
    return { error: { message: 'Collect.js not ready' }, payment_method: null };
  }

  return new Promise(resolve => {
    try {
      window.CollectJS.tokenize(response => {
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
