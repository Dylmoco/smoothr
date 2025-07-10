import { initCheckout } from '../../checkout/checkout.js';
export { initCheckout } from '../../checkout/checkout.js';

export async function waitForCheckoutDom(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const checkout = document.querySelector('[data-smoothr-checkout]');
    const cardNumber = document.querySelector('[data-smoothr-card-number]');
    const submit = document.querySelector('[data-smoothr-submit]');
    if (checkout && cardNumber && submit) {
      return { checkout, cardNumber, submit };
    }
    await new Promise(r => setTimeout(r, 100));
  }
  return null;
}

window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
if (!window.SMOOTHR_CONFIG.platform) {
  window.SMOOTHR_CONFIG.platform = 'webflow';
}

export function bindWebflowInputs() {
  const numberInput = document.querySelector('[data-smoothr-card-number] input');
  const expiryInput = document.querySelector('[data-smoothr-card-expiry] input');
  const cvcInput = document.querySelector('[data-smoothr-card-cvc] input');

  if (numberInput) {
    numberInput.addEventListener('input', () => {
      let digits = numberInput.value.replace(/\D/g, '').slice(0, 16);
      const parts = [];
      for (let i = 0; i < digits.length; i += 4) {
        parts.push(digits.slice(i, i + 4));
      }
      numberInput.value = parts.join(' ').trim();
    });
  }

  if (expiryInput) {
    expiryInput.addEventListener('input', () => {
      let digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      expiryInput.value =
        digits.length > 2
          ? `${digits.slice(0, 2)}/${digits.slice(2)}`
          : digits;
    });
  }

  if (cvcInput) {
    cvcInput.addEventListener('input', () => {
      cvcInput.value = cvcInput.value.replace(/\D/g, '').slice(0, 4);
    });
  }
}

export function bindCheckoutButton(gateway) {
  const btn = document.querySelector('[data-smoothr-checkout]');
  if (!btn) return;
  btn.addEventListener('click', async e => {
    e.preventDefault();
    console.log('[Smoothr Checkout] Submit clicked');
    btn.disabled = true;
    btn.classList.add('loading');
    try {
      if (!gateway || typeof gateway.createPaymentMethod !== 'function') {
        console.error('[Smoothr Checkout] No payment gateway available');
        alert('Payment gateway unavailable');
        return;
      }
      const { payment_method: token, error } =
        (await gateway.createPaymentMethod({
          name: 'Webflow User',
          email: 'test@example.com',
          address: { line1: '123 Webflow St' }
        })) || {};
      if (!token || error) {
        console.error('[Smoothr Checkout] Tokenization failed', error);
        alert('Payment failed');
      } else {
        console.log('[Smoothr Checkout] Token:', token);
      }
    } catch (err) {
      console.error('[Smoothr Checkout] Tokenization error', err);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await waitForCheckoutDom();
  const { gateway } = await initCheckout(window.SMOOTHR_CONFIG);
  bindWebflowInputs();
  bindCheckoutButton(gateway);
});
