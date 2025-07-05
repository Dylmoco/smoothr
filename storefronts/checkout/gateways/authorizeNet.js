let fieldsMounted = false;

export function mountCardFields() {
  const num = document.querySelector('[data-smoothr-card-number]');
  const exp = document.querySelector('[data-smoothr-card-expiry]');
  const cvc = document.querySelector('[data-smoothr-card-cvc]');
  if (num && exp && cvc) fieldsMounted = true;
}

export function isMounted() {
  return fieldsMounted;
}

export function ready() {
  const num = document.querySelector('[data-smoothr-card-number]');
  const exp = document.querySelector('[data-smoothr-card-expiry]');
  return !!num && !!exp;
}

export async function createPaymentMethod() {
  if (!ready()) {
    return { error: { message: 'Card fields missing' } };
  }
  const cardNumber = document
    .querySelector('[data-smoothr-card-number]')
    ?.value?.trim() || '';
  const expirationDate = document
    .querySelector('[data-smoothr-card-expiry]')
    ?.value?.trim() || '';
  const cardCode = document
    .querySelector('[data-smoothr-card-cvc]')
    ?.value?.trim() || '';
  if (!cardNumber || !expirationDate) {
    return { error: { message: 'Card details incomplete' } };
  }
  return { paymentMethod: { cardNumber, expirationDate, cardCode } };
}

export default {
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
};
