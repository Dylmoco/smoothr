import supabase from '../../../supabase/supabaseClient.js';

let fieldsMounted = false;
let mountPromise;
let clientKey;
let apiLoginID;
let scriptPromise;

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
    const num = document.querySelector('[data-smoothr-card-number]');
    const exp = document.querySelector('[data-smoothr-card-expiry]');
    const cvc = document.querySelector('[data-smoothr-card-cvc]');

    if (!num || !exp || !cvc) {
      warn('Card fields not found');
      return;
    }

    await resolveCredentials();
    await loadAcceptJs();

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

export async function createPaymentMethod() {
  if (!ready()) {
    return { error: { message: 'Authorize.Net not ready' } };
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
    window.Accept.dispatchData(secureData, response => {
      if (response.messages?.resultCode === 'Error') {
        const message =
          response.messages?.message?.[0]?.text || 'Tokenization failed';
        resolve({ error: { message } });
      } else {
        resolve({ success: true, payment_method: response.opaqueData });
      }
    });
  });
}

export default {
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
};
