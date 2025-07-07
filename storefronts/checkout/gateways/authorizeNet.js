import supabase from '../../../supabase/supabaseClient.js';

let fieldsMounted = false;
let mountPromise;
let clientKey;
let apiLoginID;
let scriptPromise;
let authorizeNetReady = false;
let acceptReady = false;
let submitting = false;

function updateDebug() {
  window.__SMOOTHR_DEBUG__ = {
    acceptReady,
    authorizeNetReady,
    isSubmitting: submitting
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
      .eq('integration_id', integrationId)
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
  scriptPromise = new Promise(resolve => {
    let script = document.querySelector('script[data-smoothr-accept]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://jstest.authorize.net/v1/Accept.js';
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
  if (clientKey && apiLoginID) return { clientKey, apiLoginID };
  const storeId = window.SMOOTHR_CONFIG?.storeId;
  if (!storeId) return { clientKey: null, apiLoginID: null };
  const cred = await getPublicCredential(storeId, 'authorizeNet');
  clientKey = cred?.settings?.clientKey || '';
  apiLoginID = cred?.api_key || cred?.settings?.loginId || '';
  return { clientKey, apiLoginID };
}

export async function mountCardFields() {
  if (mountPromise) return mountPromise;
  if (fieldsMounted) return;

  mountPromise = (async () => {
    log('Mounting card fields');
    const num = document.querySelector('[data-smoothr-card-number]');
    const exp = document.querySelector('[data-smoothr-card-expiry]');
    const cvc = document.querySelector('[data-smoothr-card-cvc]');

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
      input.autocomplete = 'cc-number';
      input.placeholder = 'Card number';
      num.appendChild(input);
    }
    if (!exp.querySelector('input')) {
      const input = document.createElement('input');
      input.type = 'text';
      input.autocomplete = 'cc-exp';
      input.placeholder = 'MM/YY';
      exp.appendChild(input);
    }
    if (!cvc.querySelector('input')) {
      const input = document.createElement('input');
      input.type = 'text';
      input.autocomplete = 'cc-csc';
      input.placeholder = 'CVC';
      cvc.appendChild(input);
    }

    fieldsMounted = true;
    authorizeNetReady = true;
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
  return (
    fieldsMounted &&
    !!window.Accept &&
    !!clientKey &&
    !!apiLoginID
  );
}

export function getReadiness() {
  return { acceptReady, authorizeNetReady };
}

export async function createPaymentMethod() {
  if (!ready()) {
    return { error: { message: 'Authorize.Net not ready' } };
  }

  const { acceptReady, authorizeNetReady } = getReadiness();

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

  if (submitting) {
    warn('Payment already submitting');
    return { error: { message: 'Already submitting' } };
  }

  const cardNumber =
    document.querySelector('[data-smoothr-card-number] input')?.value?.trim() || '';
  const expiry =
    document.querySelector('[data-smoothr-card-expiry] input')?.value?.trim() || '';
  const cardCode =
    document.querySelector('[data-smoothr-card-cvc] input')?.value?.trim() || '';

  if (!cardNumber || !expiry) {
    return { error: { message: 'Card details incomplete' } };
  }

  let [month, year] = expiry.split('/').map(p => p.trim());
  if (year && year.length === 2) year = '20' + year;

  const secureData = {
    authData: { clientKey, apiLoginID },
    cardData: { cardNumber, month, year, cardCode }
  };

  return new Promise(resolve => {
    if (!window.Accept || !window.Accept.dispatchData) {
      resolve({ error: { message: 'Accept.js unavailable' } });
      return;
    }
    submitting = true;
    updateDebug();
    log('Dispatching Accept.dispatchData');
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
  createPaymentMethod
};
