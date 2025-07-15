import { getPublicCredential } from '../getPublicCredential.js';
import computedInputStyle from '../utils/computedInputStyle.js';
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';

let fieldsMounted = false;
let mountPromise;
let clientKey;
let apiLoginID;
let transactionKey;
let scriptPromise;
let authorizeNetReady = false;
let acceptReady = false;
let submitting = false;
let iframeStylesApplied = false;

let debugInitialized = false;

function getReadinessState() {
  return { acceptReady, authorizeNetReady, isSubmitting: submitting };
}

function updateDebug() {
  window.__SMOOTHR_DEBUG__ = {
    ...window.__SMOOTHR_DEBUG__,
    acceptReady,
    authorizeNetReady,
    isSubmitting: submitting,
    getReadinessState,
    checkAuthorizeIframeStatus,
    getAcceptCredentials,
    checkAcceptFieldPresence
  };
  if (!debugInitialized && acceptReady && authorizeNetReady) {
    debugInitialized = true;
    log('Debug helpers ready:', window.__SMOOTHR_DEBUG__);
  }
}

function checkAuthorizeIframeStatus() {
  const num = document.querySelector('[data-smoothr-card-number] input');
  const exp = document.querySelector('[data-smoothr-card-expiry] input');
  const cvc = document.querySelector('[data-smoothr-card-cvc] input');
  return {
    acceptLoaded: !!window.Accept,
    numInput: !!num,
    expInput: !!exp,
    cvcInput: !!cvc,
    fieldsMounted
  };
}

function checkAcceptFieldPresence() {
  const num = document.querySelector(
    '[data-smoothr-card-number] input[data-accept-name="cardNumber"]'
  );
  const exp = document.querySelector(
    '[data-smoothr-card-expiry] input[data-accept-name="expiry"]'
  );
  const cvc = document.querySelector(
    '[data-smoothr-card-cvc] input[data-accept-name="cvv"]'
  );
  return !!num && !!exp && !!cvc;
}

function applyAcceptIframeStyles() {
  if (iframeStylesApplied || typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const frames = [
      ['[data-smoothr-card-number] input', 'iframe[data-accept-id][name=cardNumber]'],
      ['[data-smoothr-card-expiry] input', 'iframe[data-accept-id][name=expiry]'],
      ['[data-smoothr-card-cvc] input', 'iframe[data-accept-id][name=cvv]']
    ];
    let styled = 0;
    frames.forEach(([inputSel, frameSel]) => {
      const input = document.querySelector(inputSel);
      const frame = document.querySelector(frameSel);
      if (input && frame && !frame.dataset.smoothrStyled) {
        const cs = window.getComputedStyle(input);
        for (const prop of cs) {
          frame.style[prop] = cs.getPropertyValue(prop);
        }
        frame.dataset.smoothrStyled = 'true';
        console.log(`[Smoothr AuthorizeNet] Applied inline styles to ${frameSel}`);
      }
      if (frame?.dataset.smoothrStyled) styled++;
    });
    if (styled === frames.length || ++attempts >= 20) {
      iframeStylesApplied = styled === frames.length;
      clearInterval(interval);
    }
  }, 100);
}


function getAcceptCredentials() {
  return {
    clientKey,
    apiLoginId: apiLoginID,
    transactionKey
  };
}

const DEBUG = !!window.SMOOTHR_CONFIG?.debug;
const log = (...a) => DEBUG && console.log('[AuthorizeNet]', ...a);
const warn = (...a) => DEBUG && console.warn('[AuthorizeNet]', ...a);


function loadAcceptJs() {
  if (window.Accept) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    window.Accept = { dispatchData: () => {} };
    return Promise.resolve();
  }
  scriptPromise = new Promise(resolve => {
    let script = document.querySelector('script[data-smoothr-accept]');
    if (!script) {
      script = document.createElement('script');
      const env = window.SMOOTHR_CONFIG?.env?.toLowerCase();
      const isProd = env === 'production' || env === 'prod';
      script.src = isProd
        ? 'https://js.authorize.net/v1/Accept.js'
        : 'https://jstest.authorize.net/v1/Accept.js';
      script.type = 'text/javascript';
      script.setAttribute('data-smoothr-accept', '');
      script.addEventListener('load', () => resolve());
      document.head.appendChild(script);
    } else if (window.Accept) {
      resolve();
    } else {
      script.addEventListener('load', () => resolve());
    }
  });
  return scriptPromise;
}

async function resolveCredentials() {
  if (clientKey && apiLoginID && transactionKey !== undefined)
    return { clientKey, apiLoginID };
  const storeId = window.SMOOTHR_CONFIG?.storeId;
  if (!storeId) return { clientKey: null, apiLoginID: null };
  const cred = await getPublicCredential(storeId, 'authorizeNet');
  clientKey = cred?.settings?.client_key || '';
  apiLoginID = cred?.settings?.api_login_id || cred?.api_key || '';
  transactionKey = cred?.settings?.transaction_key || '';
  return { clientKey, apiLoginID };
}

export async function mountCardFields() {
  if (mountPromise) return mountPromise;
  if (fieldsMounted) return;

  mountPromise = (async () => {
    log('Mounting card fields');
    let num;
    let exp;
    let cvc;
    let delay = 100;
    let waited = 0;
    while (waited < 5000) {
      num = document.querySelector('[data-smoothr-card-number]');
      exp = document.querySelector('[data-smoothr-card-expiry]');
      cvc = document.querySelector('[data-smoothr-card-cvc]');
      if (num && exp && cvc) break;
      await new Promise(res => setTimeout(res, delay));
      waited += delay;
      delay = Math.min(delay * 2, 1000);
    }

    if (!num || !exp || !cvc) {
      warn('Card fields not found');
      return;
    }

    await resolveCredentials();
    await loadAcceptJs();
    log('Accept.js injected');
    if (!acceptReady) {
      acceptReady = true;
      updateDebug();
      log('Accept.js ready');
    }

    if (!num.querySelector('input')) {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('data-accept-name', 'cardNumber');
      input.classList.add('smoothr-accept-field');
      input.autocomplete = 'cc-number';
      input.placeholder = 'Card number';
      num.appendChild(input);
    }
    if (!exp.querySelector('input')) {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('data-accept-name', 'expiry');
      input.classList.add('smoothr-accept-field');
      input.autocomplete = 'cc-exp';
      input.placeholder = 'MM/YY';
      exp.appendChild(input);
    }
    if (!cvc.querySelector('input')) {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('data-accept-name', 'cvv');
      input.classList.add('smoothr-accept-field');
      input.autocomplete = 'cc-csc';
      input.placeholder = 'CVC';
      cvc.appendChild(input);
    }

    const numStyle = computedInputStyle(num);
    const expStyle = computedInputStyle(exp);
    const cvcStyle = computedInputStyle(cvc);

    const numInput = num.querySelector('input');
    const expInput = exp.querySelector('input');
    const cvcInput = cvc.querySelector('input');

    if (numInput) Object.assign(numInput.style, numStyle.input);
    if (expInput) Object.assign(expInput.style, expStyle.input);
    if (cvcInput) Object.assign(cvcInput.style, cvcStyle.input);
    console.log('[Authorize.Net] cardNumber style', numStyle);
    console.log('[Authorize.Net] cardExpiry style', expStyle);
    console.log('[Authorize.Net] cardCVC style', cvcStyle);

    const config = {
      paymentFields: {
        cardNumber: {
          selector: '[data-smoothr-card-number] input',
          placeholder: 'Card number',
          style: numStyle
        },
        expiry: {
          selector: '[data-smoothr-card-expiry] input',
          placeholder: 'MM/YY',
          style: expStyle
        },
        cvv: {
          selector: '[data-smoothr-card-cvc] input',
          placeholder: 'CVC',
          style: cvcStyle
        }
      }
    };

    log('Configuring Accept.js fields', config);
    if (window.Accept && typeof window.Accept.configure === 'function') {
      window.Accept.configure(config);
      console.log('[Authorize.Net] Accept.configure called with', config);
    } else {
      warn('Accept.configure not available');
    }

    authorizeNetReady = true;
    updateDebug();
    log('Secure card fields injected');

    let wait = 0;
    while (!checkAcceptFieldPresence() && wait < 3000) {
      await new Promise(res => setTimeout(res, 100));
      wait += 100;
    }

    if (!checkAcceptFieldPresence()) {
      warn('Timed out waiting for Accept.js inputs');
      return;
    }

    fieldsMounted = true;
    applyAcceptIframeStyles();
    updateDebug();
    log('Card fields mounted');
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
  return authorizeNetReady && !!window.Accept && !!clientKey && !!apiLoginID;
}

export function getReadiness() {
  return { acceptReady, authorizeNetReady };
}

export async function createPaymentMethod() {
  log('\u26A0\uFE0F createPaymentMethod started');
  if (!ready()) {
    return { error: { message: 'Authorize.Net not ready' }, payment_method: null };
  }

  const { acceptReady, authorizeNetReady, isSubmitting } =
    getReadinessState();

  log('createPaymentMethod readiness', {
    acceptReady,
    authorizeNetReady,
    isSubmitting
  });

  if (!acceptReady) {
    console.warn('[Smoothr AuthorizeNet] \u274c Accept.js not ready');
    alert('Payment form not ready: Accept.js not loaded');
    return { error: { message: 'Accept.js not loaded' }, payment_method: null };
  }
  if (!authorizeNetReady) {
    console.warn('[Smoothr AuthorizeNet] \u274c Card fields not mounted');
    alert('Payment form not ready: Card fields not ready');
    return { error: { message: 'Card fields not ready' }, payment_method: null };
  }

  if (!checkAcceptFieldPresence()) {
    warn('Accept.js input fields missing');
    return { error: { message: 'Accept inputs missing' }, payment_method: null };
  }

  if (isSubmitting) {
    warn('Payment already submitting');
    return { error: { message: 'Already submitting' }, payment_method: null };
  }

  const cardNumberInput = document.querySelector('[data-smoothr-card-number] input');
  const expiryInput = document.querySelector('[data-smoothr-card-expiry] input');
  const cvcInput = document.querySelector('[data-smoothr-card-cvc] input');

  let cardNumber = cardNumberInput?.value?.replace(/\s+/g, '') || '';
  let cardCode = cvcInput?.value?.replace(/\D/g, '') || '';
  let month = '';
  let year = '';
  if (expiryInput?.value) {
    [month, year] = expiryInput.value.split('/').map(s => s.trim());
    if (year && year.length === 2) year = '20' + year;
  }

  const first =
    document.querySelector('[data-smoothr-bill-first-name]')?.value?.trim() || '';
  const last =
    document.querySelector('[data-smoothr-bill-last-name]')?.value?.trim() || '';
  const fullName = `${first} ${last}`.trim();

  if (!first || !last) {
    console.warn('[Authorize.Net] \u274c Missing billing name fields \u2014 aborting tokenization');
    log('\u274c Missing billing name');
    return { error: { message: 'Missing billing name' }, payment_method: null };
  }


  if (!cardNumber || !month || !year) {
    return { error: { message: 'Card details incomplete' }, payment_method: null };
  }

  const cardData = { cardNumber, month, year, cardCode, name: fullName };
  const secureData = {
    authData: { clientKey, apiLoginID },
    cardData
  };

  return new Promise(resolve => {
    if (!window.Accept || !window.Accept.dispatchData) {
      console.warn('[Authorize.Net] \u274c dispatchData was not triggered');
      resolve({ error: { message: 'Accept.js unavailable' }, payment_method: null });
      return;
    }
    submitting = true;
    updateDebug();
    log('\ud83e\uddea Dispatching tokenization:', {
      month,
      year,
      cardCode,
      name: fullName
    });
    const timeoutId = setTimeout(() => {
      console.warn(
        '[Authorize.Net] dispatchData callback never fired \u2014 possible sandbox issue'
      );
      submitting = false;
      updateDebug();
    }, 5000);
    try {
      window.Accept.dispatchData(secureData, response => {
        clearTimeout(timeoutId);
        console.log('[AuthorizeNet] Full dispatchData response:', response);
        log('\uD83D\uDD01 dispatchData response:', response);
        if (
          response.messages?.resultCode === 'Ok' &&
          response.opaqueData?.dataDescriptor &&
          response.opaqueData?.dataValue
        ) {
          submitting = false;
          updateDebug();
          resolve({ error: null, payment_method: response.opaqueData });
        } else if (response.messages?.resultCode === 'Error') {
          submitting = false;
          updateDebug();
          console.error(response.messages?.message);
          const message =
            response.messages?.message?.[0]?.text || 'Tokenization failed';
          resolve({ error: { message }, payment_method: null });
        } else {
          submitting = false;
          updateDebug();
          resolve({ error: { message: 'Authorize.Net tokenization failed' }, payment_method: null });
        }
      });
    } catch (e) {
      submitting = false;
      updateDebug();
      console.error('[Smoothr AuthorizeNet]', 'Tokenization error', e);
      resolve({ error: { message: e?.message || 'Tokenization failed' }, payment_method: null });
    }
  });
}

export default {
  mountCardFields,
  isMounted,
  ready,
  getReadiness,
  getReadinessState,
  createPaymentMethod
};
