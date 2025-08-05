import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';

let fieldsMounted = false;

export function mountCardFields() {
  // Segpay gateway currently requires no card fields
  fieldsMounted = true;
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
  isMounted,
  ready,
  createPaymentMethod
};
