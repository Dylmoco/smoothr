function rgbToHex(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function forceStripeIframeStyle(selector) {
  if (typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const container = document.querySelector(selector);
    const iframe = container?.querySelector('iframe');
    if (iframe) {
      iframe.style.width = '100%';
      iframe.style.minWidth = '100%';
      iframe.style.height = container.offsetHeight + 'px';
      iframe.style.display = 'block';
      iframe.style.opacity = '1';
      if (container) {
        container.style.width = '100%';
        container.style.minWidth = '100%';
        if (
          typeof window !== 'undefined' &&
          window.getComputedStyle(container).position === 'static'
        ) {
          container.style.position = 'relative';
        }
      }
      console.log(`[Smoothr Stripe] Forced iframe styles for ${selector}`);
      clearInterval(interval);
    } else if (++attempts >= 20) {
      clearInterval(interval);
    }
  }, 100);
}

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

if (
  typeof document !== 'undefined' &&
  typeof document.createElement === 'function' &&
  !document.querySelector('#smoothr-card-styles')
) {
  const style = document.createElement('style');
  style.id = 'smoothr-card-styles';
  style.textContent =
    '[data-smoothr-card-number],\n[data-smoothr-card-expiry],\n[data-smoothr-card-cvc]{display:block;position:relative;}\niframe[data-accept-id]{display:block!important;}';
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

export async function mountCardFields() {
  if (mountPromise) return mountPromise;
  if (fieldsMounted) return;

  mountPromise = (async () => {
    log('Mounting split fields');
    const numberTarget = document.querySelector('[data-smoothr-card-number]');
    const expiryTarget = document.querySelector('[data-smoothr-card-expiry]');
    const cvcTarget = document.querySelector('[data-smoothr-card-cvc]');
    const emailInput = document.querySelector('[data-smoothr-email]');

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
      const placeholderEl = numberTarget.querySelector('[data-smoothr-card-placeholder]');
      const placeholderText = placeholderEl ? placeholderEl.textContent.trim() : 'Card Number';
      const fieldStyle = window.getComputedStyle(numberTarget);
      let placeholderStyle;
      if (placeholderEl) {
        placeholderStyle = window.getComputedStyle(placeholderEl);
      } else if (emailInput) {
        placeholderStyle = window.getComputedStyle(emailInput, '::placeholder');
      } else {
        placeholderStyle = fieldStyle;
      }
      console.log('[Stripe] Placeholder color:', placeholderStyle.color);
      console.log('[Stripe] Placeholder font-family:', placeholderStyle.fontFamily);
      console.log('[Stripe] Placeholder font-size:', placeholderStyle.fontSize);
      console.log('[Stripe] Placeholder opacity:', placeholderStyle.opacity);
      console.log('[Stripe] Placeholder font-weight:', placeholderStyle.fontWeight);
      const placeholderColorHex = rgbToHex(placeholderStyle.color);
      const style = {
        base: {
          backgroundColor: 'transparent',
          color: fieldStyle.color,
          fontFamily: fieldStyle.fontFamily,
          fontSize: fieldStyle.fontSize,
          fontStyle: fieldStyle.fontStyle,
          fontWeight: fieldStyle.fontWeight,
          letterSpacing: fieldStyle.letterSpacing,
          textAlign: fieldStyle.textAlign,
          textShadow: fieldStyle.textShadow,
          '::placeholder': {
            color: placeholderColorHex,
            fontFamily: placeholderStyle.fontFamily,
            fontSize: placeholderStyle.fontSize,
            fontStyle: placeholderStyle.fontStyle,
            fontWeight: placeholderStyle.fontWeight,
            letterSpacing: placeholderStyle.letterSpacing,
            textAlign: placeholderStyle.textAlign
          }
        },
        invalid: {
          color: '#fa755a'
        }
      };
      console.log('[Stripe] cardNumber style', style);
      const el = elements.create('cardNumber', { style, placeholder: placeholderText });
      el.mount('[data-smoothr-card-number]');
      console.log('[Stripe] Mounted iframe');
      if (placeholderEl) placeholderEl.style.display = 'none';
      setTimeout(() => {
        const iframe = document.querySelector('[data-smoothr-card-number] iframe');
        const width = iframe?.getBoundingClientRect().width;
        console.log('[Stripe] iframe bbox', width);
        if (iframe && width < 10) {
          console.warn('[Stripe] iframe dead → remounting now...');
          cardNumberElement?.unmount?.();
          cardNumberElement = elements.create('cardNumber', { style, placeholder: placeholderText });
          cardNumberElement.mount('[data-smoothr-card-number]');
          forceStripeIframeStyle('[data-smoothr-card-number]');
          if (placeholderEl) placeholderEl.style.display = 'none';
        }
      }, 500);
      forceStripeIframeStyle('[data-smoothr-card-number]');
      cardNumberElement = el;
    }
    const existingExpiry = els.getElement ? els.getElement('cardExpiry') : null;
    if (expiryTarget && !existingExpiry) {
      await waitForInteractable(expiryTarget);
      const placeholderEl = expiryTarget.querySelector('[data-smoothr-expiry-placeholder]');
      const placeholderText = placeholderEl ? placeholderEl.textContent.trim() : 'MM/YY';
      const fieldStyle = window.getComputedStyle(expiryTarget);
      let placeholderStyle;
      if (placeholderEl) {
        placeholderStyle = window.getComputedStyle(placeholderEl);
      } else if (emailInput) {
        placeholderStyle = window.getComputedStyle(emailInput, '::placeholder');
      } else {
        placeholderStyle = fieldStyle;
      }
      console.log('[Stripe] Placeholder color:', placeholderStyle.color);
      console.log('[Stripe] Placeholder font-family:', placeholderStyle.fontFamily);
      console.log('[Stripe] Placeholder font-size:', placeholderStyle.fontSize);
      console.log('[Stripe] Placeholder opacity:', placeholderStyle.opacity);
      console.log('[Stripe] Placeholder font-weight:', placeholderStyle.fontWeight);
      const placeholderColorHex = rgbToHex(placeholderStyle.color);
      const style = {
        base: {
          backgroundColor: 'transparent',
          color: fieldStyle.color,
          fontFamily: fieldStyle.fontFamily,
          fontSize: fieldStyle.fontSize,
          fontStyle: fieldStyle.fontStyle,
          fontWeight: fieldStyle.fontWeight,
          letterSpacing: fieldStyle.letterSpacing,
          textAlign: fieldStyle.textAlign,
          textShadow: fieldStyle.textShadow,
          '::placeholder': {
            color: placeholderColorHex,
            fontFamily: placeholderStyle.fontFamily,
            fontSize: placeholderStyle.fontSize,
            fontStyle: placeholderStyle.fontStyle,
            fontWeight: placeholderStyle.fontWeight,
            letterSpacing: placeholderStyle.letterSpacing,
            textAlign: placeholderStyle.textAlign
          }
        },
        invalid: {
          color: '#fa755a'
        }
      };
      console.log('[Stripe] cardExpiry style', style);
      const el = elements.create('cardExpiry', { style, placeholder: placeholderText });
      el.mount('[data-smoothr-card-expiry]');
      console.log('[Stripe] Mounted iframe');
      if (placeholderEl) placeholderEl.style.display = 'none';
      setTimeout(() => {
        const iframe = document.querySelector('[data-smoothr-card-expiry] iframe');
        const width = iframe?.getBoundingClientRect().width;
        console.log('[Stripe] iframe bbox', width);
        if (iframe && width < 10) {
          console.warn('[Stripe] iframe dead → remounting now...');
          el?.unmount?.();
          const remount = elements.create('cardExpiry', { style, placeholder: placeholderText });
          remount.mount('[data-smoothr-card-expiry]');
          forceStripeIframeStyle('[data-smoothr-card-expiry]');
          if (placeholderEl) placeholderEl.style.display = 'none';
        }
      }, 500);
      forceStripeIframeStyle('[data-smoothr-card-expiry]');
    }
    const existingCvc = els.getElement ? els.getElement('cardCvc') : null;
    if (cvcTarget && !existingCvc) {
      await waitForInteractable(cvcTarget);
      const placeholderEl = cvcTarget.querySelector('[data-smoothr-cvv-placeholder]');
      const placeholderText = placeholderEl ? placeholderEl.textContent.trim() : 'CVC';
      const fieldStyle = window.getComputedStyle(cvcTarget);
      let placeholderStyle;
      if (placeholderEl) {
        placeholderStyle = window.getComputedStyle(placeholderEl);
      } else if (emailInput) {
        placeholderStyle = window.getComputedStyle(emailInput, '::placeholder');
      } else {
        placeholderStyle = fieldStyle;
      }
      console.log('[Stripe] Placeholder color:', placeholderStyle.color);
      console.log('[Stripe] Placeholder font-family:', placeholderStyle.fontFamily);
      console.log('[Stripe] Placeholder font-size:', placeholderStyle.fontSize);
      console.log('[Stripe] Placeholder opacity:', placeholderStyle.opacity);
      console.log('[Stripe] Placeholder font-weight:', placeholderStyle.fontWeight);
      const placeholderColorHex = rgbToHex(placeholderStyle.color);
      const style = {
        base: {
          backgroundColor: 'transparent',
          color: fieldStyle.color,
          fontFamily: fieldStyle.fontFamily,
          fontSize: fieldStyle.fontSize,
          fontStyle: fieldStyle.fontStyle,
          fontWeight: fieldStyle.fontWeight,
          letterSpacing: fieldStyle.letterSpacing,
          textAlign: fieldStyle.textAlign,
          textShadow: fieldStyle.textShadow,
          '::placeholder': {
            color: placeholderColorHex,
            fontFamily: placeholderStyle.fontFamily,
            fontSize: placeholderStyle.fontSize,
            fontStyle: placeholderStyle.fontStyle,
            fontWeight: placeholderStyle.fontWeight,
            letterSpacing: placeholderStyle.letterSpacing,
            textAlign: placeholderStyle.textAlign
          }
        },
        invalid: {
          color: '#fa755a'
        }
      };
      console.log('[Stripe] cardCvc style', style);
      const el = elements.create('cardCvc', { style, placeholder: placeholderText });
      el.mount('[data-smoothr-card-cvc]');
      console.log('[Stripe] Mounted iframe');
      if (placeholderEl) placeholderEl.style.display = 'none';
      setTimeout(() => {
        const iframe = document.querySelector('[data-smoothr-card-cvc] iframe');
        const width = iframe?.getBoundingClientRect().width;
        console.log('[Stripe] iframe bbox', width);
        if (iframe && width < 10) {
          console.warn('[Stripe] iframe dead → remounting now...');
          el?.unmount?.();
          const remount = elements.create('cardCvc', { style, placeholder: placeholderText });
          remount.mount('[data-smoothr-card-cvc]');
          forceStripeIframeStyle('[data-smoothr-card-cvc]');
          if (placeholderEl) placeholderEl.style.display = 'none';
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