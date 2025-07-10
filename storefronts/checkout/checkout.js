import initCoreCheckout from '../core/checkout/initCheckout.js';
import { computeCartHash } from '../core/checkout/hash.js';

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);
const err = (...args) => debug && console.error('[Smoothr Checkout]', ...args);

export async function initCheckout() {
  const { provider, gateway } = await initCoreCheckout();
  if (!gateway) return;

  window.Smoothr = window.Smoothr || {};
  window.Smoothr.checkout = Object.assign({}, gateway, { version: 'dev6' });

  let block = document.querySelector('[data-smoothr-checkout]');
  if (!block) block = document.querySelector('.smoothr-checkout');
  if (!block) {
    warn('checkout form not found');
    return;
  }

  const emailField = block.querySelector('[data-smoothr-email]');
  const totalEl = block.querySelector('[data-smoothr-total]');
  const submitBtn = block.querySelector('[data-smoothr-submit]');

  gateway.mountCardFields();

  submitBtn?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    submitBtn.disabled = true;

    const email = emailField?.value?.trim() || emailField?.getAttribute('data-smoothr-email')?.trim() || '';
    const first_name = block.querySelector('[data-smoothr-first-name]')?.value?.trim() || '';
    const last_name = block.querySelector('[data-smoothr-last-name]')?.value?.trim() || '';
    const line1 = block.querySelector('[data-smoothr-ship-line1]')?.value?.trim() || '';
    const line2 = block.querySelector('[data-smoothr-ship-line2]')?.value?.trim() || '';
    const city = block.querySelector('[data-smoothr-ship-city]')?.value?.trim() || '';
    const state = block.querySelector('[data-smoothr-ship-state]')?.value?.trim() || '';
    const postal_code = block.querySelector('[data-smoothr-ship-postal]')?.value?.trim() || '';
    const country = block.querySelector('[data-smoothr-ship-country]')?.value?.trim() || '';
    const shipping = {
      name: `${first_name} ${last_name}`,
      address: { line1, line2, city, state, postal_code, country }
    };

    const bill_first_name = block.querySelector('[data-smoothr-bill-first-name]')?.value?.trim() || '';
    const bill_last_name = block.querySelector('[data-smoothr-bill-last-name]')?.value?.trim() || '';
    const bill_line1 = block.querySelector('[data-smoothr-bill-line1]')?.value?.trim() || '';
    const bill_line2 = block.querySelector('[data-smoothr-bill-line2]')?.value?.trim() || '';
    const bill_city = block.querySelector('[data-smoothr-bill-city]')?.value?.trim() || '';
    const bill_state = block.querySelector('[data-smoothr-bill-state]')?.value?.trim() || '';
    const bill_postal = block.querySelector('[data-smoothr-bill-postal]')?.value?.trim() || '';
    const bill_country = block.querySelector('[data-smoothr-bill-country]')?.value?.trim() || '';
    const billing = {
      name: `${bill_first_name} ${bill_last_name}`.trim(),
      address: {
        line1: bill_line1,
        line2: bill_line2,
        city: bill_city,
        state: bill_state,
        postal_code: bill_postal,
        country: bill_country
      }
    };

    const Smoothr = window.Smoothr || window.smoothr;
    const cart = Smoothr?.cart?.getCart() || { items: [] };
    const total =
      Smoothr?.cart?.getTotal?.() ||
      parseInt((totalEl?.textContent || '0').replace(/[^0-9]/g, ''), 10) ||
      0;
    const currency = window.SMOOTHR_CONFIG?.baseCurrency || 'USD';
    const customer_id = window.smoothr?.auth?.user?.id || null;
    const store_id = window.SMOOTHR_CONFIG?.storeId;
    const platform = window.SMOOTHR_CONFIG?.platform;

    if (!email || !first_name || !last_name || !total) {
      warn('Missing required fields; aborting checkout');
      submitBtn.disabled = false;
      return;
    }

    const cartHash = await computeCartHash(cart.items, total, email);
    const lastHash = localStorage.getItem('smoothr_last_cart_hash');
    if (cartHash === lastHash) {
      submitBtn.disabled = false;
      alert("You’ve already submitted this cart. Please wait or modify your order.");
      return;
    }
    localStorage.setItem('smoothr_last_cart_hash', cartHash);

    if (!gateway.isMounted()) await gateway.mountCardFields();
    if (!gateway.ready()) {
      err('Payment gateway not ready');
      submitBtn.disabled = false;
      return;
    }

    try {
      const billing_details = { ...billing, email };
      const { error: pmError, payment_method } = await gateway.createPaymentMethod(billing_details);
      const token = payment_method;
      if (!token || pmError) {
        err('Failed to create payment method', { error: pmError, payment_method: token });
        submitBtn.disabled = false;
        return;
      }

      const payload = {
        email,
        first_name,
        last_name,
        shipping,
        billing,
        cart: cart.items,
        total,
        currency,
        customer_id,
        store_id,
        platform
      };

      if (provider === 'stripe') {
        payload.payment_method = token.id;
      } else if (provider === 'authorizeNet') {
        payload.payment_method = token;
      } else if (provider === 'nmi') {
        Object.assign(payload, token);
      } else {
        payload.payment_method = token.id;
      }

      if (debug) {
        window.__latestSmoothrPayload = payload;
      }
      log('Submitting payload:', payload);
      const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
      if (!apiBase.startsWith('https://')) {
        err('apiBase is invalid or missing:', apiBase);
        alert('Checkout is misconfigured. Please refresh the page or contact support.');
        return;
      }

      let res;
      try {
        res = await fetch(`${apiBase}/api/checkout/${provider}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        err('Fetch failed:', error);
        throw error;
      }
      const data = await res.clone().json().catch(() => ({}));
      log('fetch response', res.status, data);
      if (res.ok && data.success) {
        Smoothr?.cart?.clearCart?.();
        window.location.href = '/checkout-success';
      } else {
        err('Checkout failed');
        alert('Failed to start checkout');
      }
    } catch (error) {
      err(error.message);
      alert('Failed to start checkout');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initCheckout);
if (document.readyState !== 'loading') {
  initCheckout();
}
