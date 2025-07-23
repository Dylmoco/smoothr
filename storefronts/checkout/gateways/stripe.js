// src/checkout/gateways/stripe.js

import { supabase } from '../../../shared/supabase/browserClient';
import { getPublicCredential } from '../getPublicCredential.js';
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';

let fieldsMounted = false;
let mountPromise;
let stripe;
let elements;
let cachedKey;
let cardNumberElement;
let cardExpiryElement;
let cardCvcElement;

/**
 * Convert an RGB(A) string to a hex color. Handles 'rgb(r, g, b)' format.
 */
function rgbToHex(rgb) {
  const nums = rgb.match(/\d+/g);
  if (!nums || nums.length < 3) return rgb;
  const [r, g, b] = nums.map(Number);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function rgbToHexSafe(color) {
  try { return rgbToHex(color); } catch { return color; }
}

/**
 * Wait for an element to be visible and clickable.
 */
export async function waitForInteractable(el, timeout = 1500) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  const attempts = Math.ceil(timeout / 100);
  for (let i = 0; i < attempts; i++) {
    if (
      el.offsetParent !== null &&
      el.getBoundingClientRect().width > 10 &&
      document.activeElement !== el
    ) {
      return;
    }
    await new Promise(r => setTimeout(r, 100));
  }
}(color) {
  try { return rgbToHex(color); } catch { return color; }
}

/**
 * Force Stripe iframe to exactly fill its container, mimicking NMI behavior.
 */
function forceStripeIframeStyle(selector) {
  if (typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const container = document.querySelector(selector);
    const iframe = container?.querySelector('iframe');
    if (iframe && container) {
      Object.assign(iframe.style, {
        position: 'absolute', top: '0', left: '0', width: '100%',
        height: `${container.offsetHeight}px`, border: 'none',
        background: 'transparent', display: 'block', opacity: '1'
      });
      Object.assign(container.style, {
        width: '100%', minWidth: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'flex-start',
        position: window.getComputedStyle(container).position === 'static' ? 'relative' : window.getComputedStyle(container).position
      });
      clearInterval(interval);
      console.log(`[Smoothr Stripe] Forced iframe styles for ${selector}`);
    } else if (++attempts >= 30) {
      clearInterval(interval);
    }
  }, 100);
}

function injectGoogleFont(family) {
  if (!family) return;
  const id = `stripe-font-${family}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
  document.head.appendChild(link);
}

function getStripeFieldCss(targetSelector, placeholderSelector) {
  const targetEl = document.querySelector(targetSelector);
  const fieldStyle = targetEl ? window.getComputedStyle(targetEl) : {};
  const placeholderEl = targetEl?.querySelector(placeholderSelector) || document.querySelector('[data-smoothr-email]');
  const placeholderStyle = placeholderEl
    ? window.getComputedStyle(placeholderEl, placeholderEl.tagName === 'INPUT' ? '::placeholder' : undefined)
    : fieldStyle;

  const placeholderText = placeholderEl?.textContent?.trim() || '';
  const placeholderColorHex = rgbToHexSafe(placeholderStyle.color);
  const fontFamily = fieldStyle.fontFamily?.split(',')[0].replace(/"/g, '').trim() || '';
  const googleFontString = `${fontFamily}:100,200,300,400,500,600,700,800,900`;
  injectGoogleFont(googleFontString);

  return {
    style: {
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
      invalid: { color: '#fa755a' }
    },
    placeholderText
  };
}

async function resolveStripeKey() {
  if (cachedKey) return cachedKey;
  const storeId = window.SMOOTHR_CONFIG?.storeId;
  if (!storeId) return null;
  try {
    const cred = await getPublicCredential(storeId, 'stripe', 'stripe');
    cachedKey = cred?.publishable_key || null;
    return cachedKey;
  } catch {
    return null;
  }
}

export async function getElements() {
  if (stripe && elements) return { stripe, elements };
  const key = await resolveStripeKey();
  if (!key) return { stripe: null, elements: null };
  stripe = Stripe(key);
  elements = stripe.elements();
  return { stripe, elements };
}

export async function mountCardFields() {
  if (mountPromise) return mountPromise;
  if (fieldsMounted) return;

  mountPromise = (async () => {
    const { elements: els } = await getElements();
    if (!els) return;
    fieldsMounted = true;

    const mounts = [
      { type: 'cardNumber', selector: '[data-smoothr-card-number]', placeholder: '[data-smoothr-card-placeholder]' },
      { type: 'cardExpiry', selector: '[data-smoothr-card-expiry]', placeholder: '[data-smoothr-expiry-placeholder]' },
      { type: 'cardCvc', selector: '[data-smoothr-card-cvc]', placeholder: '[data-smoothr-cvv-placeholder]' }
    ];

    for (const { type, selector, placeholder } of mounts) {
      const target = document.querySelector(selector);
      const existingElement = els.getElement ? els.getElement(type) : null;
      const localElement = type === 'cardNumber'
        ? cardNumberElement
        : type === 'cardExpiry'
        ? cardExpiryElement
        : cardCvcElement;
      if (!target || existingElement || localElement) continue;

      await waitForInteractable(target);
      const { style, placeholderText } = getStripeFieldCss(selector, placeholder);
      const element = els.create(type, { style, placeholder: placeholderText });
      element.mount(selector);
      forceStripeIframeStyle(selector);

      if (type === 'cardNumber') cardNumberElement = element;
      if (type === 'cardExpiry') cardExpiryElement = element;
      if (type === 'cardCvc') cardCvcElement = element;
    }
  })();

  mountPromise = mountPromise.finally(() => { mountPromise = null; });
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
      console.warn('[Smoothr Stripe] Store settings fetch failed:', error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('[Smoothr Stripe] Store settings query error:', e.message);
    return null;
  }
}

export async function createPaymentMethod(billing_details) {
  if (!ready()) return { error: { message: 'Stripe not ready' } };
  const { stripe: inst } = await getElements();
  if (!inst) return { error: { message: 'Stripe not ready' } };
  const res = await inst.createPaymentMethod({ type: 'card', card: cardNumberElement, billing_details });
  return { error: res.error || null, payment_method: res.paymentMethod || null };
}

export default {
  mountCardFields,
  isMounted,
  ready,
  getElements,
  getStoreSettings,
  createPaymentMethod
};
