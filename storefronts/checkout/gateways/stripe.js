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
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

/**
 * Safely convert color to hex, fallback to original string.
 */
function rgbToHexSafe(color) {
  try { return rgbToHex(color); } catch { return color; }
}

/**
 * Wait for element to be visible and clickable.
 */
async function waitForInteractable(el, timeout = 1500) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  const attempts = Math.ceil(timeout/100);
  for (let i=0; i<attempts; i++) {
    if (el.offsetParent!==null && el.getBoundingClientRect().width>10 && document.activeElement!==el) return;
    await new Promise(r=>setTimeout(r,100));
  }
}

/**
 * Force Stripe iframe and container to fill and display correctly.
 */
function forceStripeIframeStyle(selector) {
  if (typeof document==='undefined') return;
  let attempts=0;
  const interval = setInterval(()=>{
    const container = document.querySelector(selector);
    const iframe = container?.querySelector('iframe');
    if (iframe && container) {
      const comp = window.getComputedStyle(container);
      const heightValue = comp.height;
      // Apply container height to ensure visibility
      container.style.height = heightValue;
      Object.assign(iframe.style, {
        position:'absolute', top:'0', left:'0', width:'100%', height: heightValue,
        border:'none', background:'transparent', display:'block', opacity:'1'
      });
      Object.assign(container.style, {
        width:'100%', minWidth:'100%', display:'flex', alignItems:'center', justifyContent:'flex-start',
        position: comp.position==='static' ? 'relative' : comp.position
      });
      clearInterval(interval);
      console.log(`[Smoothr Stripe] Forced iframe styles for ${selector}`);
    } else if (++attempts>=20) {
      clearInterval(interval);
    }
  },100);
}

/**
 * Inject matching Google font from computed style.
 */
function injectGoogleFont(family) {
  if (!family) return;
  const id = `stripe-font-${family}`;
  if (document.getElementById(id)) return;
  const link=document.createElement('link');
  link.id = id;
  link.rel='stylesheet';
  link.href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Sniff field & placeholder styles from Webflow divs.
 */
function getStripeFieldCss(selector, placeholderSelector) {
  const target = document.querySelector(selector);
  if (!target) return {style:{}, placeholderText:''};
  const fieldStyle = window.getComputedStyle(target);
  const placeholderEl = target.querySelector(placeholderSelector) || document.querySelector('[data-smoothr-email]');
  const placeholderStyle = placeholderEl
    ? window.getComputedStyle(placeholderEl, placeholderEl.tagName==='INPUT'?'::placeholder':undefined)
    : fieldStyle;

  const placeholderText = placeholderEl?.textContent.trim()||'';
  const placeholderColor = rgbToHexSafe(placeholderStyle.color);
  const fontFamily = fieldStyle.fontFamily.split(',')[0].replace(/"/g,'').trim();
  injectGoogleFont(`${fontFamily}:100,200,300,400,500,600,700,800,900`);

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
        height: fieldStyle.height,
        '::placeholder': {
          color: placeholderColor,
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
  try { const cred = await getPublicCredential(storeId,'stripe','stripe'); cachedKey = cred?.publishable_key || null; return cachedKey; } catch { return null; }
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
      const existing = els.getElement ? els.getElement(type) : null;
      if (!target || existing) continue;

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

export function isMounted() { return fieldsMounted; }
export function ready() { return !!stripe && !!cardNumberElement; }

export async function getStoreSettings(storeId) {
  if (!storeId) return null;
  try {
    const { data, error } = await supabase
      .from('public_store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();
    return error ? null : data;
  } catch {
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

export default { mountCardFields, isMounted, ready, getElements, getStoreSettings, createPaymentMethod };