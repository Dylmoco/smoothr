import forceStripeIframeStyle from '../../../utils/iframeStyles.js';
import { buildStripeElementStyle } from '../../core/payments/stripeStyle.js';

import { supabase } from '../../../shared/supabase/browserClient';
import { getPublicCredential } from '../getPublicCredential.js';
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Stripe]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Stripe]', ...args);
const coreLog = (...args) => debug && console.log('[Smoothr Stripe][Core]', ...args);

log('[Smoothr Stripe] checkout gateway module loaded');

log('[Smoothr Stripe] checkout gateway loaded');

let fieldsMounted = false;
let stripe;
let elements;
let initPromise;
let cachedKey;
let cardNumberElement;
let mountPromise;

if (
  typeof document !== 'undefined' &&
  typeof document.createElement === 'function' &&
  !document.querySelector('#smoothr-card-styles')
) {
  const style = document.createElement('style');
  style.id = 'smoothr-card-styles';
  style.textContent =
    '[data-smoothr-card-number],\n[data-smoothr-card-expiry],\n[data-smoothr-card-cvc]{display:flex;position:relative;align-items:center;justify-content:flex-start;padding:0.25rem 0;}\niframe[data-accept-id]{display:block!important;}';
  document.head.appendChild(style);
}

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

export async function waitForShim(container, timeout = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const shim = container.querySelector('input.__PrivateStripeElement-input');
    if (shim) return shim;
    await new Promise(r => setTimeout(r, 50));
  }
  return null;
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
      elements = stripe.elements();
      return { stripe, elements };
    })();
  }

  return initPromise;
}


export async function mountCardFields(opts = {}) {
  coreLog('mountCardFields invoked');
  if (mountPromise) {
    coreLog('mountPromise exists → returning existing promise');
    return mountPromise;
  }
  if (fieldsMounted) return;

  const { basic = window.SMOOTHR_CONFIG?.basicStripeStyle } = opts;

  mountPromise = (async () => {
    coreLog('Mounting split fields');

    const numSel = '[data-smoothr-card-number]';
    coreLog('querySelector', numSel);
    const numberTarget = document.querySelector(numSel);
    coreLog('→', numberTarget);

    const expSel = '[data-smoothr-card-expiry]';
    coreLog('querySelector', expSel);
    const expiryTarget = document.querySelector(expSel);
    coreLog('→', expiryTarget);

    const cvcSel = '[data-smoothr-card-cvc]';
    coreLog('querySelector', cvcSel);
    const cvcTarget = document.querySelector(cvcSel);
    coreLog('→', cvcTarget);

    coreLog('Targets found', {
      number: !!numberTarget,
      expiry: !!expiryTarget,
      cvc: !!cvcTarget
    });

    if (!numberTarget && !expiryTarget && !cvcTarget) {
      warn('No stripe containers found—aborting mount');
      mountPromise = null;
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
      const placeholderEl = numberTarget.querySelector('[data-smoothr-card-placeholder]');
      const placeholderText = placeholderEl ? placeholderEl.textContent.trim() : 'Card Number';
      let style;
      let opts = { placeholder: placeholderText };
      if (!basic) {
        style = buildStripeElementStyle(
          numberTarget,
          '[data-smoothr-card-placeholder]',
          'Card Number'
        );
        opts.style = style;
        log('cardNumber style', style);
      }
      coreLog('Creating cardNumber element');
      const el = elements.create('cardNumber', opts);
      coreLog('Mounting cardNumber element');
      el.mount('[data-smoothr-card-number]');
      // Poll for the hidden shim and mark it inert so it never grabs focus
      const shimNumber = await waitForShim(numberTarget);
      if (shimNumber) {
        shimNumber.removeAttribute('aria-hidden');
        shimNumber.setAttribute('inert', '');
      }
      coreLog('Mounted cardNumber element');
      if (!basic) forceStripeIframeStyle('[data-smoothr-card-number]');
      if (placeholderEl) placeholderEl.style.display = 'none';

      setTimeout(() => {
        const iframe = document.querySelector('[data-smoothr-card-number] iframe');
        const width = iframe?.getBoundingClientRect().width;
        log('iframe bbox', width);
        if (iframe && width < 10) {
          warn('iframe dead → remounting now...');
          cardNumberElement?.unmount?.();
          cardNumberElement?.destroy?.();
          cardNumberElement = elements.create(
            'cardNumber',
            basic ? { placeholder: placeholderText } : { style, placeholder: placeholderText }
          );
          cardNumberElement.mount('[data-smoothr-card-number]');
          if (placeholderEl) {
            placeholderEl.style.visibility = 'hidden';
            if (!basic) forceStripeIframeStyle('[data-smoothr-card-number]');
          } else {
            if (!basic) forceStripeIframeStyle('[data-smoothr-card-number]');
          }
        }
      }, 500);
      if (!basic && !placeholderEl) forceStripeIframeStyle('[data-smoothr-card-number]');
      cardNumberElement = el;
    }
    const existingExpiry = els.getElement ? els.getElement('cardExpiry') : null;
    if (expiryTarget && !existingExpiry) {
      await waitForInteractable(expiryTarget);
      const placeholderEl = expiryTarget.querySelector('[data-smoothr-expiry-placeholder]');
      const placeholderText = placeholderEl ? placeholderEl.textContent.trim() : 'MM/YY';
      let style;
      let opts = { placeholder: placeholderText };
      if (!basic) {
        style = buildStripeElementStyle(
          expiryTarget,
          '[data-smoothr-expiry-placeholder]',
          'MM/YY'
        );
        opts.style = style;
        log('cardExpiry style', style);
      }
      coreLog('Creating cardExpiry element');
      const el = elements.create('cardExpiry', opts);
      coreLog('Mounting cardExpiry element');
      el.mount('[data-smoothr-card-expiry]');
      // Poll for the hidden shim and mark it inert so it never grabs focus
      const shimExpiry = await waitForShim(expiryTarget);
      if (shimExpiry) {
        shimExpiry.removeAttribute('aria-hidden');
        shimExpiry.setAttribute('inert', '');
      }
      coreLog('Mounted cardExpiry element');
      if (!basic) forceStripeIframeStyle('[data-smoothr-card-expiry]');
      if (placeholderEl) placeholderEl.style.display = 'none';

      setTimeout(() => {
        const iframe = document.querySelector('[data-smoothr-card-expiry] iframe');
        const width = iframe?.getBoundingClientRect().width;
        log('iframe bbox', width);
        if (iframe && width < 10) {
          warn('iframe dead → remounting now...');
          el?.unmount?.();
          el?.destroy?.();
          const remount = elements.create(
            'cardExpiry',
            basic ? { placeholder: placeholderText } : { style, placeholder: placeholderText }
          );
          remount.mount('[data-smoothr-card-expiry]');
          if (placeholderEl) {
            placeholderEl.style.visibility = 'hidden';
            if (!basic) forceStripeIframeStyle('[data-smoothr-card-expiry]');
          } else {
            if (!basic) forceStripeIframeStyle('[data-smoothr-card-expiry]');
          }
        }
      }, 500);
      if (!basic && !placeholderEl) forceStripeIframeStyle('[data-smoothr-card-expiry]');
    }
    const existingCvc = els.getElement ? els.getElement('cardCvc') : null;
    if (cvcTarget && !existingCvc) {
      await waitForInteractable(cvcTarget);
      const placeholderEl = cvcTarget.querySelector('[data-smoothr-cvv-placeholder]');
      const placeholderText = placeholderEl ? placeholderEl.textContent.trim() : 'CVC';
      let style;
      let opts = { placeholder: placeholderText };
      if (!basic) {
        style = buildStripeElementStyle(
          cvcTarget,
          '[data-smoothr-cvv-placeholder]',
          'CVC'
        );
        opts.style = style;
        log('cardCvc style', style);
      }
      coreLog('Creating cardCvc element');
      const el = elements.create('cardCvc', opts);
      coreLog('Mounting cardCvc element');
      el.mount('[data-smoothr-card-cvc]');
      // Poll for the hidden shim and mark it inert so it never grabs focus
      const shimCvc = await waitForShim(cvcTarget);
      if (shimCvc) {
        shimCvc.removeAttribute('aria-hidden');
        shimCvc.setAttribute('inert', '');
      }
      coreLog('Mounted cardCvc element');
      if (!basic) forceStripeIframeStyle('[data-smoothr-card-cvc]');
      if (placeholderEl) placeholderEl.style.display = 'none';

      setTimeout(() => {
        const iframe = document.querySelector('[data-smoothr-card-cvc] iframe');
        const width = iframe?.getBoundingClientRect().width;
        log('iframe bbox', width);
        if (iframe && width < 10) {
          warn('iframe dead → remounting now...');
          el?.unmount?.();
          el?.destroy?.();
          const remount = elements.create(
            'cardCvc',
            basic ? { placeholder: placeholderText } : { style, placeholder: placeholderText }
          );
          remount.mount('[data-smoothr-card-cvc]');
          if (placeholderEl) {
            placeholderEl.style.visibility = 'hidden';
            if (!basic) forceStripeIframeStyle('[data-smoothr-card-cvc]');
          } else {
            if (!basic) forceStripeIframeStyle('[data-smoothr-card-cvc]');
          }
        }
      }, 500);
      if (!basic && !placeholderEl) forceStripeIframeStyle('[data-smoothr-card-cvc]');
    }

    coreLog('Mounted split fields');
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
  waitForInteractable,
  waitForShim
};
