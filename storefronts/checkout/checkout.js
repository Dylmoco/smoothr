import * as stripeGateway from './gateways/stripe.js';

export async function computeCartHash(cart, total, email) {
  const normalized = [...cart]
    .map(item => ({ id: item.product_id, qty: item.quantity }))
    .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
  const input = `${email}-${total}-${JSON.stringify(normalized)}`;
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function initCheckout() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
  const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);
  const err = (...args) => debug && console.error('[Smoothr Checkout]', ...args);

  log('SDK initialized');
  log('SMOOTHR_CONFIG', JSON.stringify(window.SMOOTHR_CONFIG));

  const stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
  log(`stripeKey: ${stripeKey}`);
  if (!stripeKey) {
    warn('❌ Failed at Stripe Key Check: missing key');
    console.log('[Smoothr Checkout] No Stripe key provided');
    return;
  }

  log('Stripe key confirmed');

  let hasShownCheckoutError = false;

  let block = document.querySelector('[data-smoothr-checkout]');
  if (!block) {
    block = document.querySelector('.smoothr-checkout');
  }
  if (block) {
    log('form detected', block);
  } else {
    log('checkout form not found');
    return;
  }

  const productId = block.dataset.smoothrProductId;
  const emailField = block.querySelector('[data-smoothr-email]');
  const totalEl = block.querySelector('[data-smoothr-total]');
  const paymentContainer = block.querySelector('[data-smoothr-gateway]');
  const submitBtn = block.querySelector('[data-smoothr-submit]');
  const cardNumberEl = block.querySelector('[data-smoothr-card-number]');
  const cardExpiryEl = block.querySelector('[data-smoothr-card-expiry]');
  const cardCvcEl = block.querySelector('[data-smoothr-card-cvc]');
  const postalEl = block.querySelector('[data-smoothr-postal]');
  const themeEl = document.querySelector('#smoothr-checkout-theme');
  const fields = [
    ['[data-smoothr-email]', emailField?.value || ''],
    ['[data-smoothr-total]', totalEl?.textContent || ''],
    ['[data-smoothr-gateway]', paymentContainer ? 'found' : 'missing'],
    ['[data-smoothr-submit]', submitBtn ? 'found' : 'missing'],
    ['[data-smoothr-card-number]', cardNumberEl ? 'found' : 'missing'],
    ['[data-smoothr-card-expiry]', cardExpiryEl ? 'found' : 'missing'],
    ['[data-smoothr-card-cvc]', cardCvcEl ? 'found' : 'missing'],
    ['[data-smoothr-postal]', postalEl ? 'found' : 'missing']
  ];
  fields.forEach(([name, val]) => log(`${name} = ${val}`));
  if (!emailField) warn('missing [data-smoothr-email]');
  if (!totalEl) warn('missing [data-smoothr-total]');
  log('no polling loops active');

  // Initialize payment gateway fields
  stripeGateway.mountCardFields();

  submitBtn?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    submitBtn.disabled = true;
    log('[data-smoothr-submit] clicked');

    const email =
      emailField?.value?.trim() ||
      emailField?.getAttribute('data-smoothr-email')?.trim() || '';
    const first_name =
      block.querySelector('[data-smoothr-first-name]')?.value?.trim() || '';
    const last_name =
      block.querySelector('[data-smoothr-last-name]')?.value?.trim() || '';
    const line1 =
      block.querySelector('[data-smoothr-ship-line1]')?.value?.trim() || '';
    const line2 =
      block.querySelector('[data-smoothr-ship-line2]')?.value?.trim() || '';
    const city =
      block.querySelector('[data-smoothr-ship-city]')?.value?.trim() || '';
    const state =
      block.querySelector('[data-smoothr-ship-state]')?.value?.trim() || '';
    const postal_code =
      block.querySelector('[data-smoothr-ship-postal]')?.value?.trim() || '';
    const country =
      block.querySelector('[data-smoothr-ship-country]')?.value?.trim() || '';
    const shipping = {
      name: `${first_name} ${last_name}`,
      address: { line1, line2, city, state, postal_code, country }
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

    if (!stripeGateway.isMounted()) stripeGateway.mountCardFields();
    if (!stripeGateway.ready()) {
      err('Payment gateway not ready');
      submitBtn.disabled = false;
      return;
    }

    try {
      const { error: pmError, paymentMethod } =
        await stripeGateway.createPaymentMethod({
          name: `${first_name} ${last_name}`,
          email
        });

      if (pmError || !paymentMethod) {
        err(`\u274C Failed to create payment method: ${pmError?.message}`);
        submitBtn.disabled = false;
        return;
      }

      const payload = {
        email,
        payment_method: paymentMethod.id,
        first_name,
        last_name,
        shipping,
        cart: cart.items,
        total,
        currency,
        customer_id,
        store_id,
        platform
      };

      if (debug) {
        window.__latestSmoothrPayload = payload;
        console.log('[Smoothr Checkout] Submitting payload:', window.__latestSmoothrPayload);
      }
      const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
      log('POST', `${apiBase}/api/checkout/stripe`);
      const res = await fetch(`${apiBase}/api/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.clone().json().catch(() => ({}));
      log('fetch response', res.status, data);
      if (res.ok && data.success) {
        Smoothr?.cart?.clearCart?.();
        window.location.href = '/checkout-success';
      } else {
        err('Checkout failed');
        if (!hasShownCheckoutError) {
          alert('Failed to start checkout');
          hasShownCheckoutError = true;
        }
      }
    } catch (error) {
      err(`\u274C ${error.message}`);
      if (!hasShownCheckoutError) {
        alert('Failed to start checkout');
        hasShownCheckoutError = true;
      }
    } finally {
      submitBtn.disabled = false;
      log('submit handler complete');
    }
  });
  log('submit handler attached');
}

document.addEventListener('DOMContentLoaded', initCheckout);
