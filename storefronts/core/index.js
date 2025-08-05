export * from '../features/auth/sdk-auth-entry.js';
export * from './checkout.js';

import authOnly from '../features/auth/sdk-auth-entry.js';
import * as checkout from './checkout.js';

const Smoothr = { ...authOnly, ...checkout };

export default Smoothr;

if (typeof window !== 'undefined') {
  window.Smoothr = Smoothr;
  window.smoothr = window.smoothr || {};
  Object.assign(window.smoothr, Smoothr);
}
