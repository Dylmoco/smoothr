import { getPublicCredential } from '../getPublicCredential.js';

let fieldsMounted = false;
let mountPromise;
let scriptPromise;
let tokenizationKey;
let wrapperKeySet = false;
let expiryInputsInjected = false;
let visibleExpiryInjected = false;
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
    let postal;
    let delay = 100;
    let waited = 0;
    while (waited < 5000) {
      num = document.querySelector('[data-smoothr-card-number]');
      exp = document.querySelector('[data-smoothr-card-expiry]');
      cvc = document.querySelector('[data-smoothr-card-cvc]');
      postal = document.querySelector('[data-smoothr-postal]');
      if (num && exp) break;
      await new Promise(res => setTimeout(res, delay));
      waited += delay;
      delay = Math.min(delay * 2, 1000);
    }

    if (!num || !exp) {
      warn('Card fields not found');
      return;
    }

    if (exp && !exp.querySelector('input')) {
      const visible = document.createElement('input');
      visible.type = 'text';
      visible.inputMode = 'numeric';
      visible.placeholder = 'MM/YY';
      visible.autocomplete = 'cc-exp';
      visible.setAttribute('data-smoothr-expiry-visible', '');
      exp.appendChild(visible);
      visibleExpiryInjected = true;
    }

    const key = await resolveTokenizationKey();

    if (!wrapperKeySet) {
      if (key) {
        const fields = [num, exp, cvc].filter(Boolean);
        let wrapper = fields[0];
        while (wrapper && !fields.every(f => wrapper.contains(f))) {
          wrapper = wrapper.parentElement;
        }
        if (wrapper) {
          wrapper.setAttribute('data-tokenization-key', key);
          wrapperKeySet = true;
          log('Tokenization key applied to wrapper');
        } else {
          warn('Wrapper element for tokenization key not found');
        }
      } else {
        warn('No tokenization key available for mounting');
      }
    }

    const wrapperAudit = [num, exp, cvc].filter(Boolean);
    let auditWrapper = wrapperAudit[0];
    while (auditWrapper && !wrapperAudit.every(f => auditWrapper.contains(f))) {
      auditWrapper = auditWrapper.parentElement;
    }
    if (auditWrapper && !auditWrapper.hasAttribute('data-tokenization-key')) {
      console.warn('[NMI AUDIT] Missing tokenization key on wrapper');
    }

    const ensureInput = (target, collect, hidden) => {
      if (!target) return null;
      let el = target.querySelector(`input[data-collect="${collect}"]`);
      if (!el) {
        el = document.createElement('input');
        el.type = hidden ? 'hidden' : 'text';
        el.setAttribute('data-collect', collect);
        if (hidden) el.style.display = 'none';
        target.appendChild(el);
        log('Injected input for', collect);
      }
      return el;
    };

    ensureInput(num, 'cardNumber');
    ensureInput(cvc, 'cvv');
    ensureInput(postal, 'postal');
    let monthInput = null;
    let yearInput = null;

    const expInput =
      exp?.querySelector('input[data-smoothr-expiry-visible]') ||
      exp?.querySelector('input:not([data-collect])') ||
      exp?.querySelector('input');

    const syncExpiry = () => {
      if (!expInput) return;
      const raw = expInput.value || '';
      const match = raw.replace(/\s+/g, '').match(/^(\d{1,2})\/?(\d{2,4})$/);
      if (match) {
        if (!expiryInputsInjected) {
          monthInput = ensureInput(exp, 'expMonth', true);
          yearInput = ensureInput(exp, 'expYear', true);
          expiryInputsInjected = !!monthInput && !!yearInput;
          if (expiryInputsInjected) {
            if (visibleExpiryInjected && !visibleAndHiddenLogged) {
              console.log('[NMI] Injected visible expiry field + hidden expiry inputs');
              visibleAndHiddenLogged = true;
            } else {
              log('Injected expiry inputs after valid parsing');
            }
          }
        }
        if (!monthInput || !yearInput) return;
        let [, m, y] = match;
        if (m.length === 1) m = '0' + m;
        if (y.length === 2) y = '20' + y;
        monthInput.value = m;
        yearInput.value = y;
        log('Synced expiry', { expMonth: m, expYear: y });
      } else {
        if (monthInput) monthInput.value = '';
        if (yearInput) yearInput.value = '';
      }
    };

    if (expInput) {
      expInput.addEventListener('keyup', syncExpiry);
      expInput.addEventListener('change', syncExpiry);
      syncExpiry();
    }

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
