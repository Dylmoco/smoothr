let fieldsMounted = false;
let mountAttempts = 0;
let stripe;
let elements;
let cardNumberElement;

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Stripe]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Stripe]', ...args);

function forceStripeIframeStyle(selector) {
  if (typeof document === 'undefined') return;
  let attempts = 0;
  const interval = setInterval(() => {
    const targetEl = document.querySelector(selector);
    const iframe = targetEl?.querySelector('iframe');
    if (iframe) {
      iframe.style.width = '100%';
      iframe.style.minWidth = '100%';
      iframe.style.height = targetEl ? `${targetEl.offsetHeight}px` : '100%';
      iframe.style.display = 'block';
      iframe.style.opacity = '1';
      iframe.style.boxSizing = 'border-box';
      iframe.style.position = 'relative';
      if (
        targetEl &&
        typeof window !== 'undefined' &&
        window.getComputedStyle(targetEl).position === 'static'
      ) {
        targetEl.style.position = 'relative';
      }
      log('[debug] Stripe iframe forced styles');
      clearInterval(interval);
    } else {
      log(`Waiting for Stripe iframe in ${selector} (${attempts + 1})`);
      if (++attempts >= 20) {
        warn(`iframe not found in ${selector} after ${attempts} attempts`);
        clearInterval(interval);
      }
    }
  }, 100);
}

function elementStyleFromContainer(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return {};
  const cs = window.getComputedStyle(el);
  return {
    base: {
      fontSize: cs.fontSize,
      color: cs.color,
      fontFamily: cs.fontFamily,
      backgroundColor: cs.backgroundColor
    }
  };
}

function getElements() {
  if (!stripe) {
    const stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
    if (!stripeKey) return null;
    log('Using Stripe key', stripeKey);
    stripe = Stripe(stripeKey);
    elements = stripe.elements();
  }
  return elements;
}

export function mountCardFields() {
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
      setTimeout(mountCardFields, 200);
    } else {
      warn('card fields not found');
    }
    return;
  }

  const els = getElements();
  if (!els) return;

  if (numberTarget && !cardNumberElement) {
    cardNumberElement = els.create('cardNumber', {
      style: elementStyleFromContainer(numberTarget)
    });
    cardNumberElement.mount('[data-smoothr-card-number]');
    forceStripeIframeStyle('[data-smoothr-card-number]');
    fieldsMounted = true;
  }
  if (expiryTarget) {
    const el = els.create('cardExpiry', {
      style: elementStyleFromContainer(expiryTarget)
    });
    el.mount('[data-smoothr-card-expiry]');
    forceStripeIframeStyle('[data-smoothr-card-expiry]');
  }
  if (cvcTarget) {
    const el = els.create('cardCvc', {
      style: elementStyleFromContainer(cvcTarget)
    });
    el.mount('[data-smoothr-card-cvc]');
    forceStripeIframeStyle('[data-smoothr-card-cvc]');
  }

  log('Mounted split fields');
}

export function isMounted() {
  return fieldsMounted;
}

export function ready() {
  return !!stripe && !!cardNumberElement;
}

export async function createPaymentMethod(billing_details) {
  if (!ready()) {
    return { error: { message: 'Stripe not ready' } };
  }
  return stripe.createPaymentMethod({
    type: 'card',
    card: cardNumberElement,
    billing_details
  });
}

export default {
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
};
