
import { resolveTokenizationKey } from '../providers/nmi.js';
import waitForElement from '../utils/waitForElement.js';

let isMountedFlag = false;
let hasMounted = false;
let mountCount = 0;
let mountTimeout = null;

const DEBUG = !!window.SMOOTHR_CONFIG?.debug;
const log = (...a) => DEBUG && console.log('[NMI]', ...a);
const warn = (...a) => console.warn('[NMI]', ...a);

const CONFIG = {
  ATTRIBUTES: {
    CARD_NUMBER: '[data-smoothr-card-number]',
    CARD_EXPIRY: '[data-smoothr-card-expiry]',
    CARD_CVC: '[data-smoothr-card-cvc]',
    POSTAL: '[data-smoothr-bill-postal]',
  },
  COLLECTJS_URL: 'https://secure.nmi.com/token/Collect.js',
};

function waitForCollectJsReady(callback, retries = 50, delay = 200) {
  if (window.CollectJS && typeof window.CollectJS.tokenize === 'function') {
    log('CollectJS loaded and tokenize available');
    callback();
    return;
  }
  if (retries <= 0) {
    warn('Collect.js failed to load after retries');
    throw new Error('Collect.js not available');
  }
  setTimeout(() => waitForCollectJsReady(callback, retries - 1, delay), delay);
}

function parseExpiry(val) {
  const m = val.trim().match(/^(\d{1,2})\s*\/?\s*(\d{2,4})$/);
  if (!m) return [null, null];
  let [, mon, yr] = m;
  mon = mon.padStart(2, '0');
  yr = yr.length === 2 ? '20' + yr : yr;
  return [mon, yr];
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
  mm.value = mon || '';
  yy.value = yr || '';
}

export async function mountNMIFields() {
  if (hasMounted) {
    log('NMI fields already mounted, skipping');
    return Promise.resolve();
  }

  mountCount++;
  log(`mountNMIFields called ${mountCount} times`);
  hasMounted = true; // Set immediately to prevent further calls

  if (mountTimeout) {
    log('Debouncing mountNMIFields');
    clearTimeout(mountTimeout);
  }
  mountTimeout = setTimeout(async () => {
    try {
      const tokenizationKey = await resolveTokenizationKey();
      log('Raw tokenization key from Supabase:', tokenizationKey);
      if (!tokenizationKey || typeof tokenizationKey !== 'string') {
        warn('Invalid or missing NMI tokenization key:', tokenizationKey);
        throw new Error('Invalid NMI tokenization key');
      }
      log('NMI tokenization key fetched:', tokenizationKey.slice(0, 8) + '...');

      const cardNumberDiv = await waitForElement(CONFIG.ATTRIBUTES.CARD_NUMBER, 15000);
      const expiryDiv = await waitForElement(CONFIG.ATTRIBUTES.CARD_EXPIRY, 15000);
      const cvcDiv = await waitForElement(CONFIG.ATTRIBUTES.CARD_CVC, 15000);
      const postalDiv = document.querySelector(CONFIG.ATTRIBUTES.POSTAL);
      if (!cardNumberDiv || !expiryDiv || !cvcDiv || !postalDiv) {
        warn('Missing required card input divs:', { cardNumberDiv, expiryDiv, cvcDiv, postalDiv });
        throw new Error('Required card input divs not found');
      }

      log('Found card input divs:', {
        cardNumber: !!cardNumberDiv,
        expiry: !!expiryDiv,
        cvc: !!cvcDiv,
        postal: !!postalDiv,
      });

      [cardNumberDiv, expiryDiv, cvcDiv, postalDiv].forEach(el =>
        el.setAttribute('data-tokenization-key', tokenizationKey)
      );

      expiryDiv.querySelectorAll('input[data-collect="expMonth"],input[data-collect="expYear"],input[data-collect="ccexp"]')
        .forEach(i => i.remove());

      return new Promise((resolve, reject) => {
        const setupCollect = () => {
          try {
            log('Configuring CollectJS with fields:', {
              ccnumber: CONFIG.ATTRIBUTES.CARD_NUMBER,
              ccexp: CONFIG.ATTRIBUTES.CARD_EXPIRY,
              cvv: CONFIG.ATTRIBUTES.CARD_CVC,
              postalCode: CONFIG.ATTRIBUTES.POSTAL,
            });
            window.CollectJS.configure({
              tokenizationKey,
              variant: 'inline',
              fields: {
                ccnumber: { selector: CONFIG.ATTRIBUTES.CARD_NUMBER },
                ccexp: { selector: CONFIG.ATTRIBUTES.CARD_EXPIRY },
                cvv: { selector: CONFIG.ATTRIBUTES.CARD_CVC },
                postalCode: { selector: CONFIG.ATTRIBUTES.POSTAL },
              },
              callback: () => {
                log('CollectJS configured successfully');
                log('CollectJS object:', Object.keys(window.CollectJS));
                const iframes = document.querySelectorAll('iframe');
                log('Iframes after configuration:', iframes.length, Array.from(iframes).map(i => i.parentElement));
                isMountedFlag = true;
                resolve();
              },
              fieldsAvailable: () => {
                log('CollectJS fields mounted');
                const fields = Object.keys(window.CollectJS.getFieldDetails() || {});
                log('Detected fields:', fields);
              },
              validationCallback: (field, status, message) => {
                if (!status) warn(`Validation error in ${field}: ${message}`);
              },
            });
          } catch (e) {
            warn('CollectJS configuration failed:', e.message);
            reject(e);
          }
        };

        const scriptSrc = `${CONFIG.COLLECTJS_URL}?v=${Date.now()}`;
        let script = document.querySelector(`script[src*="${CONFIG.COLLECTJS_URL}"]`);
        if (!script) {
          script = document.createElement('script');
          script.src = scriptSrc;
          script.setAttribute('data-tokenization-key', tokenizationKey);
          script.async = true;
          document.head.appendChild(script);
          script.addEventListener('load', setupCollect);
          script.addEventListener('error', () => {
            warn('Failed to load Collect.js script');
            reject(new Error('Collect.js script failed to load'));
          });
        } else if (window.CollectJS && typeof window.CollectJS.tokenize === 'function') {
          log('CollectJS already loaded');
          setupCollect();
        } else {
          script.src = scriptSrc;
          document.head.appendChild(script);
          script.addEventListener('load', setupCollect);
          script.addEventListener('error', () => {
            warn('Failed to load Collect.js script');
            reject(new Error('Collect.js script failed to load'));
          });
        }
      });
    } catch (e) {
      warn('Failed to mount NMI fields:', e.message);
      throw e;
    }
  }, 500);
}

export function isMounted() {
  const numberFrame = document.querySelector(`${CONFIG.ATTRIBUTES.CARD_NUMBER} iframe`);
  const expiryFrame = document.querySelector(`${CONFIG.ATTRIBUTES.CARD_EXPIRY} iframe`);
  const cvcFrame = document.querySelector(`${CONFIG.ATTRIBUTES.CARD_CVC} iframe`);
  const postalFrame = document.querySelector(`${CONFIG.ATTRIBUTES.POSTAL} iframe`);
  const monthInput = document.querySelector('input[data-collect="expMonth"]');
  const yearInput = document.querySelector('input[data-collect="expYear"]');

  log('isMounted check:', {
    collectJS: !!window.CollectJS,
    tokenize: typeof window.CollectJS?.tokenize,
    numberFrame: !!numberFrame,
    expiryFrame: !!expiryFrame,
    cvcFrame: !!cvcFrame,
    postalFrame: !!postalFrame,
    monthInput: !!monthInput,
    yearInput: !!yearInput,
  });

  return (
    !!window.CollectJS &&
    typeof window.CollectJS.tokenize === 'function' &&
    !!numberFrame &&
    !!expiryFrame &&
    !!cvcFrame &&
    !!postalFrame &&
    !!monthInput &&
    !!yearInput
  );
}

export function ready() {
  const wrapper = document.querySelector('[data-tokenization-key]');
  const key = wrapper?.getAttribute('data-tokenization-key') || tokenizationKey;
  const number = document.querySelector(CONFIG.ATTRIBUTES.CARD_NUMBER);
  const cvc = document.querySelector(CONFIG.ATTRIBUTES.CARD_CVC);
  const postal = document.querySelector(CONFIG.ATTRIBUTES.POSTAL);
  const month = document.querySelector('input[data-collect="expMonth"]');
  const year = document.querySelector('input[data-collect="expYear"]');
  const expiryInput = document.querySelector('input[data-collect="ccexp"]');

  log('ready check:', {
    collectJS: !!window.CollectJS,
    tokenize: typeof window.CollectJS?.tokenize,
    key: !!key,
    number: !!number,
    cvc: !!cvc,
    postal: !!postal,
    month: !!month,
    year: !!year,
    expiryInput: !!expiryInput,
  });

  return (
    !!window.CollectJS &&
    typeof window.CollectJS.tokenize === 'function' &&
    !!key &&
    !!number &&
    !!cvc &&
    !!postal &&
    !!month &&
    !!year &&
    !!expiryInput
  );
}

export async function createPaymentMethod() {
  if (!ready()) {
    warn('Collect.js not ready');
    alert('Payment error: Form not ready. Please refresh and try again.');
    return { error: { message: 'Collect.js not ready' }, payment_method: null };
  }

  const expiryEl = document.querySelector(`${CONFIG.ATTRIBUTES.CARD_EXPIRY} iframe`)?.contentDocument?.querySelector('input[name="ccexp"]');
  const expiryRaw = expiryEl?.value || '';
  const [expMonth, expYear] = parseExpiry(expiryRaw);

  if (!expMonth || !expYear) {
    warn('Invalid expiry format:', expiryRaw);
    alert('Invalid card expiry. Please use MM/YY format.');
    return { error: { message: 'Invalid card expiry' }, payment_method: null };
  }

  log('Parsed expiry', { expMonth, expYear });

  return new Promise(resolve => {
    try {
      window.CollectJS.tokenize({ expMonth, expYear }, response => {
        log('Tokenize response:', response);
        if (response && response.token) {
          resolve({ error: null, payment_method: { payment_token: response.token } });
        } else {
          const message = response?.error || 'Tokenization failed. Please check your card details.';
          warn('Tokenize error:', message);
          alert(message);
          resolve({ error: { message }, payment_method: null });
        }
      });
    } catch (e) {
      warn('Tokenization error:', e.message);
      alert('Payment error: Unable to process card details.');
      resolve({ error: { message: e?.message || 'Tokenization failed' }, payment_method: null });
    }
  });
}

export { mountNMIFields as mountCardFields };

export default {
  mountCardFields: mountNMIFields,
  isMounted,
  ready,
  createPaymentMethod,
};

if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {};
  window.Smoothr.mountNMIFields = mountNMIFields;

  const observer = new MutationObserver((mutations) => {
    if (!hasMounted && document.querySelector(CONFIG.ATTRIBUTES.CARD_NUMBER)) {
      log('Mutation detected, attempting mount');
      observer.disconnect(); // Disconnect on first detection
      mountNMIFields().catch(err => warn('Failed to mount NMI fields:', err.message));
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState !== 'loading' && !hasMounted) {
    mountNMIFields().catch(err => warn('Failed to mount NMI fields:', err.message));
  }
}
