import supabase from '../../../supabase/supabaseClient.js';

let fieldsMounted = false;
let mountPromise;
let clientKey;
let apiLoginID;
let transactionKey;
let scriptPromise;
let authorizeNetReady = false;
let acceptReady = false;
let submitting = false;

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

function getAcceptCredentials() {
  return {
    clientKey,
    apiLoginId: apiLoginID,
    transactionKey
  };
}

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr AuthorizeNet]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr AuthorizeNet]', ...args);

async function getPublicCredential(storeId, integrationId) {
  if (!storeId || !integrationId) return null;
  try {
    const { data, error } = await supabase
      .from('store_integrations')
      .select('api_key, settings')
      .eq('store_id', storeId)
      .eq('provider', integrationId)
      .maybeSingle();
    if (error) {
      warn('Credential lookup failed:', error.message || error);
      return null;
    }
    return data;
  } catch (e) {
    warn('Credential fetch error:', e?.message || e);
    return null;
  }
}

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
  log('\ud83e\uddea createPaymentMethod called');
  if (!ready()) {
    return { error: { message: 'Authorize.Net not ready' } };
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
    return { error: { message: 'Accept.js not loaded' } };
  }
  if (!authorizeNetReady) {
    console.warn('[Smoothr AuthorizeNet] \u274c Card fields not mounted');
    alert('Payment form not ready: Card fields not ready');
    return { error: { message: 'Card fields not ready' } };
  }

  if (!checkAcceptFieldPresence()) {
    warn('Accept.js input fields missing');
    return { error: { message: 'Accept inputs missing' } };
  }

  if (isSubmitting) {
    warn('Payment already submitting');
    return { error: { message: 'Already submitting' } };
  }

  const cardNumber =
    document.querySelector('[data-smoothr-card-number] input')?.value?.trim() || '';
  const expiry =
    document.querySelector('[data-smoothr-card-expiry] input')?.value?.trim() || '';
  const cardCode =
    document.querySelector('[data-smoothr-card-cvc] input')?.value?.trim() || '';

  const first =
    document.querySelector('[data-smoothr-bill-first-name]')?.value?.trim() || '';
  const last =
    document.querySelector('[data-smoothr-bill-last-name]')?.value?.trim() || '';
  const fullName = `${first} ${last}`.trim();

  if (!first || !last) {
    console.warn('[Authorize.Net] \u274c Missing billing name fields \u2014 aborting tokenization');
    return;
  }


  if (!cardNumber || !expiry) {
    return { error: { message: 'Card details incomplete' } };
  }

  let [month, year] = expiry.split('/').map(p => p.trim());
  if (year && year.length === 2) year = '20' + year;

  const cardData = { cardNumber, month, year, cardCode, name: fullName };
  const secureData = {
    authData: { clientKey, apiLoginID },
    cardData
  };

  return new Promise(resolve => {
    if (!window.Accept || !window.Accept.dispatchData) {
      console.warn('[Authorize.Net] \u274c dispatchData was not triggered');
      resolve({ error: { message: 'Accept.js unavailable' } });
      return;
    }
    submitting = true;
    updateDebug();
    log('\ud83e\uddea Dispatching tokenization with cardData:', cardData);
    try {
      window.Accept.dispatchData(secureData, response => {
        submitting = false;
        updateDebug();
        if (response.messages?.resultCode === 'Error') {
          const message =
            response.messages?.message?.[0]?.text || 'Tokenization failed';
          resolve({ error: { message } });
        } else {
          resolve({ success: true, payment_method: response.opaqueData });
        }
      });
    } catch (e) {
      submitting = false;
      updateDebug();
      console.error('[Smoothr AuthorizeNet]', 'Tokenization error', e);
      resolve({ error: { message: e?.message || 'Tokenization failed' } });
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
