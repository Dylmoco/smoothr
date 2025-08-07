import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';

let fieldsMounted = false;

export function mountCardFields() {
  // Segpay gateway currently requires no card fields
  fieldsMounted = true;
}

export async function mountCheckout(config) {
  if (isMounted()) return;
  await mountCardFields(config);
}

export function isMounted() {
  return fieldsMounted;
}

export function ready() {
  return true;
}

export async function createPaymentMethod() {
  // Placeholder payment method identifier
  return { payment_method: { id: 'segpay' } };
}

export default {
  mountCardFields,
  mountCheckout,
  isMounted,
  ready,
  createPaymentMethod
};
