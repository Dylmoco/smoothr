import { initCheckout } from '../../checkout/checkout.js';

export { initCheckout };

// Bootstrap the shared checkout flow as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
});
