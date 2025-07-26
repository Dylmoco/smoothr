import forceStripeIframeStyle, { elementStyleFromContainer, getFonts, initStripeStyles } from './forceStripeIframeStyle.js';
import { supabase } from '../../../shared/supabase/browserClient';
import { getPublicCredential } from '../getPublicCredential.js';
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';
let fieldsMounted = false;
let mountAttempts = 0;
let stripe;
let elements;
let initPromise;
let cachedKey;
let cardNumberElement;
let mountPromise;

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Stripe]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Stripe]', ...args);

initStripeStyles();

export async function waitForVisible(el, timeout = 1000) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  log('Waiting for element to be visible', el);
  for (let i = 0; i < 10; i++) {
    if (el.getBoundingClientRect().width > 10) {
      log('Element visible', el);
      return;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  warn('Element still invisible after timeout', el);
}

export async function waitForInteractable(el, timeout = 1500) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  log('Waiting for mount target to be visible and clickable');
  const attempts = Math.ceil(timeout / 100);
  for (let i = 0; i < attempts; i++) {
    if (
      el.offsetParent !== null &&
      el.getBoundingClientRect().width > 10 &&
      document.activeElement !== el
    ) {
      log('Target ready → mounting...');
      return;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  warn('Mount target not interactable after 1.5s');
}

async function resolveStripeKey() {
  if (cachedKey) return cachedKey;
  const storeId = window.SMOOTHR_CONFIG?.storeId;
  let key;
  if (storeId) {
    try {
      const cred = await getPublicCredential(storeId, 'stripe', 'stripe');
      if (cred) {
        key = cred.publishable_key || '';
        if (key) {
          log('✅ Stripe key resolved, mounting gateway...');
        }
      }
    } catch (e) {
      warn('Integration fetch error:', e?.message || e);
    }
  }
  if (!key) {
    warn('❌ Stripe key not found — aborting Stripe mount.');
    return null;
  }
  cachedKey = key;
  return key;
}

export async function getElements() {
  if (stripe && elements) {
    return { stripe, elements };
  }

  if (!initPromise) {
    initPromise = (async () => {
      const stripeKey = await resolveStripeKey();
      if (!stripeKey) return { stripe: null, elements: null };
      log('Using Stripe key', stripeKey);
      stripe = Stripe(stripeKey);

      const fonts = getFonts();

      elements = stripe.elements({ fonts });
      return { stripe, elements };
    })();
  }

  return initPromise;
}

export async function mountCardFields() {
  if (mountPromise) return mountPromise;
  if (fieldsMounted) return;

  mountPromise = (async () => {
    log('Mounting split fields');
    const numberTarget = document.querySelector('[data-smoothr-card-number]');
    const expiryTarget = document.querySelector('[data-smoothr-card-expiry]');
    const cvcTarget = document.querySelector('[data-smoothr-card-cvc]');

    log('Targets found', {
      number: !!numberTarget,
      expiry: !!expiryTarget,
      cvc: !!cvcTarget
    });

    if (!numberTarget && !expiryTarget && !cvcTarget) {
      if (mountAttempts < 5) {
        mountAttempts++;
        mountPromise = null;
        setTimeout(mountCardFields, 200);
      } else {
        warn('card fields not found');
        mountPromise = null;
      }
      return;
    }

    const { elements: els } = await getElements();
    if (!els) {
      mountPromise = null;
      return;
    }

    fieldsMounted = true;

  const existingNumber = els.getElement ? els.getElement('cardNumber') : null;
  if (numberTarget && !existingNumber) {
    await waitForInteractable(numberTarget);
    const numStyle = elementStyleFromContainer(numberTarget);
    console.log('[Stripe] cardNumber style', numStyle);
    const el = elements.create('cardNumber', { style: numStyle });
    el.mount('[data-smoothr-card-number]');
    console.log('[Stripe] Mounted iframe');
    setTimeout(() => {
      const iframe = document.querySelector('[data-smoothr-card-number] iframe');
      const width = iframe?.getBoundingClientRect().width;
      console.log('[Stripe] iframe bbox', width);
      if (iframe && width < 10) {
        console.warn('[Stripe] iframe dead → remounting now...');
        cardNumberElement?.unmount?.();
        cardNumberElement = elements.create('cardNumber', { style: numStyle });
        cardNumberElement.mount('[data-smoothr-card-number]');
        forceStripeIframeStyle('[data-smoothr-card-number]');
      }
    }, 500);
    forceStripeIframeStyle('[data-smoothr-card-number]');
    cardNumberElement = el;
  }
  const existingExpiry = els.getElement ? els.getElement('cardExpiry') : null;
  if (expiryTarget && !existingExpiry) {
    await waitForInteractable(expiryTarget);
    const expiryStyle = elementStyleFromContainer(expiryTarget);
    console.log('[Stripe] cardExpiry style', expiryStyle);
    const el = elements.create('cardExpiry', { style: expiryStyle });
    el.mount('[data-smoothr-card-expiry]');
    console.log('[Stripe] Mounted iframe');
    setTimeout(() => {
      const iframe = document.querySelector('[data-smoothr-card-expiry] iframe');
      const width = iframe?.getBoundingClientRect().width;
      console.log('[Stripe] iframe bbox', width);
      if (iframe && width < 10) {
        console.warn('[Stripe] iframe dead → remounting now...');
        el?.unmount?.();
        const remount = elements.create('cardExpiry', { style: expiryStyle });
        remount.mount('[data-smoothr-card-expiry]');
        forceStripeIframeStyle('[data-smoothr-card-expiry]');
      }
    }, 500);
    forceStripeIframeStyle('[data-smoothr-card-expiry]');
  }
  const existingCvc = els.getElement ? els.getElement('cardCvc') : null;
  if (cvcTarget && !existingCvc) {
    await waitForInteractable(cvcTarget);
    const cvcStyle = elementStyleFromContainer(cvcTarget);
    console.log('[Stripe] cardCvc style', cvcStyle);
    const el = elements.create('cardCvc', { style: cvcStyle });
    el.mount('[data-smoothr-card-cvc]');
    console.log('[Stripe] Mounted iframe');
    setTimeout(() => {
      const iframe = document.querySelector('[data-smoothr-card-cvc] iframe');
      const width = iframe?.getBoundingClientRect().width;
      console.log('[Stripe] iframe bbox', width);
      if (iframe && width < 10) {
        console.warn('[Stripe] iframe dead → remounting now...');
        el?.unmount?.();
        const remount = elements.create('cardCvc', { style: cvcStyle });
        remount.mount('[data-smoothr-card-cvc]');
        forceStripeIframeStyle('[data-smoothr-card-cvc]');
      }
    }, 500);
    forceStripeIframeStyle('[data-smoothr-card-cvc]');
  }

  log('Mounted split fields');
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
  return !!stripe && !!cardNumberElement;
}

export async function getStoreSettings(storeId) {
  if (!storeId) return null;
  try {
    const { data, error } = await supabase
      .from('public_store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return null;
    }
    return data || null;
  } catch (e) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}

export async function createPaymentMethod(billing_details) {
  if (!ready()) {
    return { error: { message: 'Stripe not ready' } };
  }

  const { stripe: stripeInstance, elements: els } = await getElements();
  if (!stripeInstance || !els) {
    return { error: { message: 'Stripe not ready' } };
  }

  const card =
    cardNumberElement ||
    (typeof els.getElement === 'function' ? els.getElement('cardNumber') : null);
  const res = await stripeInstance.createPaymentMethod({
    type: 'card',
    card,
    billing_details
  });
  return {
    error: res.error || null,
    payment_method: res.paymentMethod || null
  };
}

export default {
  mountCardFields,
  isMounted,
  ready,
  getStoreSettings,
  getElements,
  createPaymentMethod,
  waitForVisible,
  waitForInteractable
};