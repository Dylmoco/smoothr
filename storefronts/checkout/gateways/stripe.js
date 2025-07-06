import forceStripeIframeStyle from './forceStripeIframeStyle.js';
let fieldsMounted = false;
let mountAttempts = 0;
let stripe;
let elements;
let cardNumberElement;

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Stripe]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Stripe]', ...args);

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

export async function mountCardFields() {
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
    await waitForVisible(numberTarget);
    cardNumberElement = els.create('cardNumber', {
      style: elementStyleFromContainer(numberTarget)
    });
    cardNumberElement.mount('[data-smoothr-card-number]');
    forceStripeIframeStyle('[data-smoothr-card-number]');
    fieldsMounted = true;
  }
  if (expiryTarget) {
    await waitForVisible(expiryTarget);
    const el = els.create('cardExpiry', {
      style: elementStyleFromContainer(expiryTarget)
    });
    el.mount('[data-smoothr-card-expiry]');
    forceStripeIframeStyle('[data-smoothr-card-expiry]');
  }
  if (cvcTarget) {
    await waitForVisible(cvcTarget);
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
  createPaymentMethod,
  waitForVisible
};
