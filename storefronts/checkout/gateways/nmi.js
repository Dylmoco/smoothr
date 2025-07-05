let fieldsMounted = false;

export function mountCardFields() {
  const num = document.querySelector('[data-smoothr-card-number]');
  const exp = document.querySelector('[data-smoothr-card-expiry]');
  const cvc = document.querySelector('[data-smoothr-card-cvc]');
  if (num && exp) fieldsMounted = true;
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
  const ccnumber = document
    .querySelector('[data-smoothr-card-number]')
    ?.value?.trim() || '';
  const ccexp = document
    .querySelector('[data-smoothr-card-expiry]')
    ?.value?.trim() || '';
  const cvv = document.querySelector('[data-smoothr-card-cvc]')?.value?.trim() || '';
  if (!ccnumber || !ccexp) {
    return { error: { message: 'Card details incomplete' } };
  }
  return { paymentMethod: { ccnumber, ccexp, cvv } };
}

export default {
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
};
