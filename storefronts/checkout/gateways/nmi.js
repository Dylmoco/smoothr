// src/checkout/gateways/nmi.js

import { resolveTokenizationKey } from '../providers/nmi.js'
import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js'
import { disableButton, enableButton } from '../utils/cartHash.js'

let hasMounted = false
let isConfigured = false
let isLocked = false
let isSubmitting = false
let configPromise
let resolveConfig

function rgbToHex(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Public entry: fetch tokenization key and initialize NMI
 * Returns a promise resolving when config completes
 */
export async function mountCardFields() {
  if (hasMounted) return configPromise
  hasMounted = true
  configPromise = new Promise(resolve => { resolveConfig = resolve })

  const storeId = window.SMOOTHR_CONFIG.storeId
  const tokenKey = await resolveTokenizationKey(storeId, 'nmi', 'nmi')
  if (!tokenKey) {
    console.warn('[NMI] Tokenization key missing')
    alert('Payment setup issue. Please try again or contact support.')
    resolveConfig()
    return configPromise
  }

  initNMI(tokenKey)
  return configPromise
}

/**
 * Inject CollectJS and configure
 */
export function initNMI(tokenKey) {
  if (isConfigured) return
  console.log('[NMI] Appending CollectJS script...')

  // Get styles early for script attributes
  const cardNumberDiv = document.querySelector('[data-smoothr-card-number]')
  const divStyle = getComputedStyle(cardNumberDiv)
  const emailInput = document.querySelector('[data-smoothr-email]')
  let placeholderStyle;
  if (emailInput) {
    placeholderStyle = getComputedStyle(emailInput, '::placeholder')
    console.log('[NMI] Placeholder color:', placeholderStyle.color)
    console.log('[NMI] Placeholder font-family:', placeholderStyle.fontFamily)
    console.log('[NMI] Placeholder font-size:', placeholderStyle.fontSize)
    console.log('[NMI] Placeholder opacity:', placeholderStyle.opacity)
    console.log('[NMI] Placeholder font-weight:', placeholderStyle.fontWeight)
  } else {
    console.warn('[NMI] Email input not found, falling back to original placeholder style')
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector('[data-smoothr-card-placeholder]')
    placeholderStyle = cardNumberPlaceholderEl ? getComputedStyle(cardNumberPlaceholderEl) : divStyle
  }
  const placeholderColorHex = rgbToHex(placeholderStyle.color)
  console.log('[NMI] Placeholder color hex:', placeholderColorHex)
  const placeholderFontWeight = placeholderStyle.fontWeight
  const fontFamily = placeholderStyle.fontFamily.split(',')[0].trim().replace(/"/g, '')
  const googleFontString = `${fontFamily}:100,200,300,400,500,600,700,800,900`
  console.log('[NMI] Dynamic Google font:', googleFontString)

  const customCssObj = {
    'background-color': 'transparent',
    'border': 'none',
    'box-shadow': 'none',
    'margin': '0',
    'color': divStyle.color,
    'font-family': divStyle.fontFamily,
    'font-size': divStyle.fontSize,
    'font-style': divStyle.fontStyle,
    'font-weight': divStyle.fontWeight,
    'letter-spacing': divStyle.letterSpacing,
    'line-height': divStyle.lineHeight,
    'text-align': divStyle.textAlign,
    'text-shadow': divStyle.textShadow,
    'width': '100%',
    'height': divStyle.height,
    'min-height': divStyle.minHeight,
    'max-height': divStyle.maxHeight,
    'box-sizing': 'border-box',
    'padding-top': divStyle.paddingTop,
    'padding-right': divStyle.paddingRight,
    'padding-bottom': divStyle.paddingBottom,
    'padding-left': divStyle.paddingLeft,
    'display': 'flex',
    'align-items': 'center',
    'justify-content': 'flex-start',
    'outline': 'none',
    'vertical-align': 'middle'
  }

  const placeholderCssObj = {
    'color': placeholderColorHex,
    'font-family': placeholderStyle.fontFamily,
    'font-size': placeholderStyle.fontSize,
    'font-style': placeholderStyle.fontStyle,
    'font-weight': placeholderFontWeight,
    'letter-spacing': placeholderStyle.letterSpacing,
    'line-height': placeholderStyle.lineHeight,
    'text-align': placeholderStyle.textAlign,
    'opacity': placeholderStyle.opacity
  }

  const script = document.createElement('script')
  script.id = 'collectjs-script'
  script.src = 'https://secure.nmi.com/token/Collect.js'
  script.async = true
  script.setAttribute('data-tokenization-key', tokenKey)
  script.setAttribute('data-custom-css', JSON.stringify(customCssObj))
  script.setAttribute('data-placeholder-css', JSON.stringify(placeholderCssObj))
  script.setAttribute('data-style-sniffer', 'true')
  script.setAttribute('data-google-font', googleFontString)
  console.log('[NMI] Set data-tokenization-key on script tag:', tokenKey.substring(0, 8) + '…')

  script.onload = () => {
    console.log('[NMI] CollectJS loaded')
    configureCollectJS()
  }
  script.onerror = () => {
    console.error('[NMI] Failed to load CollectJS')
    alert('Unable to load payment system. Please refresh the page.')
    resolveConfig()
  }

  document.head.appendChild(script)
}

/**
 * Configure fields & click guard
 */
function configureCollectJS() {
  if (isLocked || typeof CollectJS === 'undefined') {
    return setTimeout(configureCollectJS, 500)
  }
  isLocked = true

  try {
    // Get styles from the placeholder div
    const cardNumberDiv = document.querySelector('[data-smoothr-card-number]')
    // Get placeholder info from Webflow elements with custom attributes
    const cardNumberPlaceholderEl = cardNumberDiv.querySelector('[data-smoothr-card-placeholder]')
    const expiryPlaceholderEl = document.querySelector('[data-smoothr-card-expiry] [data-smoothr-expiry-placeholder]')
    const cvcPlaceholderEl = document.querySelector('[data-smoothr-card-cvc] [data-smoothr-cvv-placeholder]')
    const cardNumberPlaceholderText = cardNumberPlaceholderEl ? cardNumberPlaceholderEl.textContent.trim() : 'Card Number'
    const expiryPlaceholderText = expiryPlaceholderEl ? expiryPlaceholderEl.textContent.trim() : 'MM/YY'
    const cvcPlaceholderText = cvcPlaceholderEl ? cvcPlaceholderEl.textContent.trim() : 'CVC'

    CollectJS.configure({
      variant: 'inline',
      fields: {
        ccnumber: { selector: '[data-smoothr-card-number]', placeholder: cardNumberPlaceholderText },
        ccexp:   { selector: '[data-smoothr-card-expiry]', placeholder: expiryPlaceholderText },
        cvv:     { selector: '[data-smoothr-card-cvc]', placeholder: cvcPlaceholderText }
      },
      fieldsAvailableCallback() {
        console.log('[NMI] Fields available')
        // Style the iframes directly and force height
        const iframes = document.querySelectorAll('iframe[id^="CollectJS"]')
        iframes.forEach(iframe => {
          iframe.style.position   = 'absolute'
          iframe.style.top        = '0'
          iframe.style.left       = '0'
          iframe.style.width      = '100%'
          iframe.style.height     = cardNumberDiv.offsetHeight + 'px'
          iframe.style.border     = 'none'
          iframe.style.background = 'transparent'
        })
        // Hide your Webflow placeholder DIVs
        ;[cardNumberPlaceholderEl, expiryPlaceholderEl, cvcPlaceholderEl].forEach(el => el && (el.style.display = 'none'))
      },
      callback(response) {
        const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))
        if (!response.token) {
          console.error('[NMI] Tokenization failed', response.reason)
          alert('Please check your payment details and try again.')
          resetSubmission(buttons)
          return
        }
        console.log('[NMI] Token:', response.token)

        // Build full payload
        const firstName = document.querySelector('[data-smoothr-first-name]')?.value || ''
        const lastName  = document.querySelector('[data-smoothr-last-name]')?.value || ''
        const email     = document.querySelector('[data-smoothr-email]')?.value || ''
        const shipLine1 = document.querySelector('[data-smoothr-ship-line1]')?.value || ''
        const shipLine2 = document.querySelector('[data-smoothr-ship-line2]')?.value || ''
        const shipCity  = document.querySelector('[data-smoothr-ship-city]')?.value || ''
        const shipState = document.querySelector('[data-smoothr-ship-state]')?.value || ''
        const shipPostal= document.querySelector('[data-smoothr-ship-postal]')?.value || ''
        const shipCountry = document.querySelector('[data-smoothr-ship-country]')?.value || ''
        const sameBilling = !!document.querySelector('[data-smoothr-billing-same-as-shipping]:checked')
        let billLine1   = sameBilling ? shipLine1 : document.querySelector('[data-smoothr-bill-line1]')?.value || ''
        let billLine2   = sameBilling ? shipLine2 : document.querySelector('[data-smoothr-bill-line2]')?.value || ''
        let billCity    = sameBilling ? shipCity  : document.querySelector('[data-smoothr-bill-city]')?.value || ''
        let billState   = sameBilling ? shipState : document.querySelector('[data-smoothr-bill-state]')?.value || ''
        let billPostal  = sameBilling ? shipPostal: document.querySelector('[data-smoothr-bill-postal]')?.value || ''
        let billCountry = sameBilling ? shipCountry: document.querySelector('[data-smoothr-bill-country]')?.value || ''
        const cartData = window.Smoothr.cart.getCart() || { items: [] }
        const items = Array.isArray(cartData.items) ? cartData.items : []
        const total = Math.round((window.Smoothr.cart.getTotal() || 0) * 100)
        const currency = window.SMOOTHR_CONFIG.baseCurrency || 'USD'

        // Add billing validation if not same as shipping
        if (!sameBilling) {
          if (!billLine1 || !billCity || !billState || !billPostal || !billCountry) {
            alert('Please fill in all billing details.')
            resetSubmission(buttons)
            return
          }
        }

        const payload = {
          payment_token: response.token,
          store_id: window.SMOOTHR_CONFIG.storeId,
          first_name: firstName,
          last_name: lastName,
          email,
          shipping: {
            name: `${firstName} ${lastName}`.trim(),
            address: { line1: shipLine1, line2: shipLine2, city: shipCity, state: shipState, postal_code: shipPostal, country: shipCountry }
          },
          billing: {
            name: `${firstName} ${lastName}`.trim(),
            address: { line1: billLine1, line2: billLine2, city: billCity, state: billState, postal_code: billPostal, country: billCountry }
          },
          cart: items.map(item => ({ product_id: item.product_id, name: item.name, quantity: item.quantity, price: Math.round((item.price || 0) * 100) })),
          total,
          currency,
          same_billing: sameBilling  // Added this flag for backend
        }

        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
          resetSubmission(buttons)
          return { error: 'NMI gateway calls disabled in test environment' }
        }

        fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json().then(data => {
            handleSuccessRedirect(res, data)
            resetSubmission(buttons)
          }))
          .catch(err => {
            console.error('[NMI] POST error', err)
            alert('Payment processing error. Please try again.')
            resetSubmission(buttons)
          })
      }
    })

    // Guarded click handler picks up correct token method
    const buttons = Array.from(document.querySelectorAll('[data-smoothr-pay]'))
    const tokenFn = CollectJS.tokenize || CollectJS.requestToken || CollectJS.startPaymentRequest || null
    buttons.forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault()
        if (isSubmitting) return false
        isSubmitting = true
        buttons.forEach(disableButton)
        if (tokenFn) tokenFn()
        else resetSubmission(buttons)
        return false
      })
    })

    isConfigured = true
    console.log('[NMI] Config complete')
    resolveConfig()
  } catch (e) {
    console.error('[NMI] Config error', e)
    alert('Setup error. Refresh or contact support.')
    resetSubmission(Array.from(document.querySelectorAll('[data-smoothr-pay]')))
    resolveConfig()
  }
}

/**
 * Re-enable buttons & clear flags
 */
function resetSubmission(buttons) {
  isLocked = false
  isSubmitting = false
  buttons.forEach(enableButton)
}

// Exports & auto-mount
export const mountNMI = mountCardFields
export function isMounted() { return isConfigured }
export function ready() { return isConfigured }
export async function createPaymentMethod() { return { error:{message:'use CollectJS callback'}, payment_method:null } }
export default { mountCardFields, isMounted, ready, createPaymentMethod }

if (typeof window !== 'undefined') {
  window.Smoothr = window.Smoothr || {}
  if (document.readyState === 'complete') mountCardFields()
  else document.addEventListener('DOMContentLoaded', mountCardFields)
}

stripe.js here is my stripe js, please make the changes i asked for, and hand back in full, do not ammend anything thats not to do with styles pelease:

import forceStripeIframeStyle from './forceStripeIframeStyle.js';
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


function elementStyleFromContainer(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return {};
  const cs = window.getComputedStyle(el);
  const style = {
    base: {
      fontSize: cs.fontSize,
      color: cs.color,
      fontFamily: cs.fontFamily,
      backgroundColor: cs.backgroundColor,
      borderColor: cs.borderColor,
      borderWidth: cs.borderWidth,
      borderStyle: cs.borderStyle,
      borderRadius: cs.borderRadius,
      padding: cs.padding
    }
  };
  console.log('[Stripe] element style from container', style);
  return style;
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