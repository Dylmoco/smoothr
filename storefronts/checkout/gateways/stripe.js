let fieldsMounted = false;
let mountAttempts = 0;
let stripe;
let elements;
let cardNumberElement;

function getElements() {
  if (!stripe) {
    const stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
    if (!stripeKey) return null;
    stripe = Stripe(stripeKey);
    elements = stripe.elements();
  }
  return elements;
}

export function mountCardFields() {
  const numberTarget = document.querySelector('[data-smoothr-card-number]');
  const expiryTarget = document.querySelector('[data-smoothr-card-expiry]');
  const cvcTarget = document.querySelector('[data-smoothr-card-cvc]');

  if (!numberTarget && !expiryTarget && !cvcTarget) {
    if (mountAttempts < 5) {
      mountAttempts++;
      setTimeout(mountCardFields, 200);
    }
    return;
  }

  const els = getElements();
  if (!els) return;

  if (numberTarget && !cardNumberElement) {
    cardNumberElement = els.create('cardNumber');
    cardNumberElement.mount('[data-smoothr-card-number]');
    fieldsMounted = true;
  }
  if (expiryTarget) {
    const el = els.create('cardExpiry');
    el.mount('[data-smoothr-card-expiry]');
  }
  if (cvcTarget) {
    const el = els.create('cardCvc');
    el.mount('[data-smoothr-card-cvc]');
  }
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
