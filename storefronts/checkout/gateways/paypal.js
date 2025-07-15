import { handleSuccessRedirect } from '../utils/handleSuccessRedirect.js';

let fieldsMounted = false;

export function mountCardFields() {
  // PayPal does not require credit card fields
  fieldsMounted = true;
}

export function isMounted() {
  return fieldsMounted;
}

export function ready() {
  return true;
}

export async function createPaymentMethod() {
  // Return a placeholder object to satisfy checkout payload requirements
  return { payment_method: { id: 'paypal' } };
}

export default {
  mountCardFields,
  isMounted,
  ready,
  createPaymentMethod
};
