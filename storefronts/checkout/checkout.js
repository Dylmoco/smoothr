
(() => {
  if (window.__SMOOTHR_CHECKOUT_INITIALIZED__) return;
  window.__SMOOTHR_CHECKOUT_INITIALIZED__ = true;
})();

if (
  typeof document !== 'undefined' &&
  typeof document.createElement === 'function' &&
  !document.querySelector('#smoothr-card-styles')
) {
  const style = document.createElement('style');
  style.id = 'smoothr-card-styles';
  style.textContent =
    '[data-smoothr-card-number],\n[data-smoothr-card-expiry],\n[data-smoothr-card-cvc]{display:block;position:relative;}\niframe[data-accept-id]{display:block!important;}';
  document.head.appendChild(style);
}

import supabase from '../../supabase/supabaseClient.js';
import { getPublicCredential } from './getPublicCredential.js';
import bindCardInputs from './utils/inputFormatters.js';
import waitForElement from './utils/waitForElement.js';

const gatewayLoaders = {
  stripe: () => import('./gateways/stripe.js'),
  authorizeNet: () => import('./gateways/authorizeNet.js'),
  paypal: () => import('./gateways/paypal.js'),
  nmi: () => import('./gateways/nmi.js'),
  segpay: () => import('./gateways/segpay.js')
};

async function getActivePaymentGateway(log, warn) {
  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.active_payment_gateway) return cfg.active_payment_gateway;
  const storeId = cfg.storeId;
  if (!storeId) {
    warn('Store ID missing; defaulting to stripe');
    return 'stripe';
  }
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('settings')
      .eq('store_id', storeId)
      .maybeSingle();
    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return 'stripe';
    }
    const gateway = data?.settings?.active_payment_gateway;
    if (!gateway) {
      warn('active_payment_gateway missing; defaulting to stripe');
      return 'stripe';
    }
    return gateway;
  } catch (e) {
    warn('Gateway lookup failed:', e?.message || e);
    return 'stripe';
  }
}

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
  if (window.__SMOOTHR_CHECKOUT_BOUND__) return;
  window.__SMOOTHR_CHECKOUT_BOUND__ = true;
  let isSubmitting = false;
  const debug = window.SMOOTHR_CONFIG?.debug;
  const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
  const warn = (...args) => console.warn('[Smoothr Checkout]', ...args);
  const err = (...args) => debug && console.error('[Smoothr Checkout]', ...args);

  log('SDK initialized');
  log('SMOOTHR_CONFIG', JSON.stringify(window.SMOOTHR_CONFIG));

  const provider = await getActivePaymentGateway(log, warn);
  let loader = gatewayLoaders[provider];
  if (!loader) {
    warn(`Unknown payment gateway: ${provider}; falling back to stripe`);
    loader = gatewayLoaders.stripe;
  }
  const gateway = (await loader()).default;
  log(`Using gateway: ${provider}`);

  window.Smoothr = window.Smoothr || window.smoothr || {};
  window.smoothr = window.Smoothr;
  window.Smoothr.checkout = {
    ...(window.Smoothr.checkout || {}),
    version: 'dev6',
    ...gateway
  };

  if (provider === 'stripe') {
    let stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
    if (!stripeKey) {
      const storeId = window.SMOOTHR_CONFIG?.storeId;
      const cred = await getPublicCredential(storeId, 'stripe');
      stripeKey = cred?.api_key || cred?.settings?.publishable_key || '';
      if (stripeKey) window.SMOOTHR_CONFIG.stripeKey = stripeKey;
    }
    log(`stripeKey: ${stripeKey}`);
    if (!stripeKey) {
      warn('❌ Failed at Stripe Key Check: missing key');
      console.log('[Smoothr Checkout] No Stripe key provided');
      return;
    }
    log('Stripe key confirmed');
  }

  let hasShownCheckoutError = false;

  const select = sel => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return document.querySelector(sel);
    }
    return waitForElement(sel, 5000);
  };

  const checkoutEl = await select('[data-smoothr-checkout]');
  if (checkoutEl) {
    log('checkout trigger found', checkoutEl);
  } else {
    warn('missing [data-smoothr-checkout]');
    return;
  }

  const block = checkoutEl.closest?.('[data-smoothr-product-id]') || document;
  const productId =
    checkoutEl.dataset?.smoothrProductId || block.dataset?.smoothrProductId;
  const q = sel => block.querySelector(sel) || document.querySelector(sel);

  const emailField = await select('[data-smoothr-email]');
  const totalEl = await select('[data-smoothr-total]');
  const paymentContainer = q('[data-smoothr-gateway]');
  const cardNumberEl = q('[data-smoothr-card-number]');
  const cardExpiryEl = q('[data-smoothr-card-expiry]');
  const cardCvcEl = q('[data-smoothr-card-cvc]');
  const postalEl = q('[data-smoothr-bill-postal]'); // Updated to match nmi.js
  const themeEl = document.querySelector('#smoothr-checkout-theme');
  const fields = [
    ['[data-smoothr-email]', emailField?.value || ''],
    ['[data-smoothr-total]', totalEl?.textContent || ''],
    ['[data-smoothr-gateway]', paymentContainer ? 'found' : 'missing'],
    ['[data-smoothr-checkout]', checkoutEl ? 'found' : 'missing'],
    ['[data-smoothr-card-number]', cardNumberEl ? 'found' : 'missing'],
    ['[data-smoothr-card-expiry]', cardExpiryEl ? 'found' : 'missing'],
    ['[data-smoothr-card-cvc]', cardCvcEl ? 'found' : 'missing'],
    ['[data-smoothr-bill-postal]', postalEl ? 'found' : 'missing'] // Updated log
  ];
  fields.forEach(([name, val]) => log(`${name} = ${val}`));
  if (!emailField) warn('missing [data-smoothr-email]');
  if (!totalEl) warn('missing [data-smoothr-total]');
  log('no polling loops active');

  // Initialize payment gateway fields
  if (!gateway.isMounted()) {
    await gateway.mountCardFields();
  }
  bindCardInputs();

  const isForm = checkoutEl.tagName?.toLowerCase() === 'form';
  const eventName = isForm ? 'submit' : 'click';

  checkoutEl?.addEventListener(eventName, async event => {
    event.preventDefault();
    event.stopPropagation();
    if (isSubmitting) {
      warn('Checkout already in progress');
      return;
    }
    isSubmitting = true;
    if ('disabled' in checkoutEl) checkoutEl.disabled = true;
    log('[data-smoothr-checkout] triggered');

    const email =
      emailField?.value?.trim() ||
      emailField?.getAttribute('data-smoothr-email')?.trim() || '';
    const first_name = q('[data-smoothr-first-name]')?.value?.trim() || '';
    const last_name = q('[data-smoothr-last-name]')?.value?.trim() || '';
    const line1 = q('[data-smoothr-ship-line1]')?.value?.trim() || '';
    const line2 = q('[data-smoothr-ship-line2]')?.value?.trim() || '';
    const city = q('[data-smoothr-ship-city]')?.value?.trim() || '';
    const state = q('[data-smoothr-ship-state]')?.value?.trim() || '';
    const postal_code = q('[data-smoothr-ship-postal]')?.value?.trim() || '';
    const country = q('[data-smoothr-ship-country]')?.value?.trim() || '';
    const shipping = {
      name: `${first_name} ${last_name}`,
      address: { line1, line2, city, state, postal_code, country }
    };

    const bill_first_name = q('[data-smoothr-bill-first-name]')?.value?.trim() || '';
    const bill_last_name = q('[data-smoothr-bill-last-name]')?.value?.trim() || '';
    const bill_line1 = q('[data-smoothr-bill-line1]')?.value?.trim() || '';
    const bill_line2 = q('[data-smoothr-bill-line2]')?.value?.trim() || '';
    const bill_city = q('[data-smoothr-bill-city]')?.value?.trim() || '';
    const bill_state = q('[data-smoothr-bill-state]')?.value?.trim() || '';
    const bill_postal = q('[data-smoothr-bill-postal]')?.value?.trim() || '';
    const bill_country = q('[data-smoothr-bill-country]')?.value?.trim() || '';
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
      if ('disabled' in checkoutEl) checkoutEl.disabled = false;
      isSubmitting = false;
      return;
    }

    const cartHash = await computeCartHash(cart.items, total, email);
    const lastHash = localStorage.getItem('smoothr_last_cart_hash');
    if (cartHash === lastHash) {
      if ('disabled' in checkoutEl) checkoutEl.disabled = false;
      isSubmitting = false;
      alert("You’ve already submitted this cart. Please wait or modify your order.");
      return;
    }
    localStorage.setItem('smoothr_last_cart_hash', cartHash);

    if (!gateway.ready()) { // Only check ready, don’t re-mount
      err('Payment gateway not ready');
      if ('disabled' in checkoutEl) checkoutEl.disabled = false;
      isSubmitting = false;
      return;
    }

    try {
      const billing_details = { ...billing, email };
      const { error: pmError, payment_method } =
        await gateway.createPaymentMethod(billing_details);

      const token = payment_method;
      console.log('[AuthorizeNet] ✅ Got payment method:', token);
      if (
        provider === 'authorizeNet' &&
        (!token?.dataDescriptor || !token?.dataValue)
      ) {
        alert('Invalid payment details. Please try again.');
        if ('disabled' in checkoutEl) checkoutEl.disabled = false;
        isSubmitting = false;
        return;
      }
      if (!token || pmError) {
        err('Failed to create payment method', { error: pmError, payment_method: token });
        if ('disabled' in checkoutEl) checkoutEl.disabled = false;
        isSubmitting = false;
        return;
      }

      const payload = {
        email,
        first_name,
        last_name,
        shipping,
        billing,
        billing_first_name: bill_first_name,
        billing_last_name: bill_last_name,
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
      console.log('[Smoothr Checkout] Submitting payload:', payload);
      const apiBase = window.SMOOTHR_CONFIG?.apiBase || '';
      log('POST', `${apiBase}/api/checkout/${provider}`);

      if (!apiBase.startsWith('https://')) {
        console.error(
          '[Smoothr Checkout] ❌ apiBase is invalid or missing:',
          apiBase
        );
        alert('Checkout is misconfigured. Please refresh the page or contact support.');
        return;
      }

      let res;
      try {
        if (provider === 'authorizeNet') {
          const orderPayload = {
            email,
            name: `${first_name} ${last_name}`.trim(),
            cart: cart.items,
            total_price: total,
            currency,
            gateway: provider,
            shipping,
            billing,
            store_id
          };
          const orderRes = await fetch(`${apiBase}/api/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
          });
          const orderData = await orderRes.clone().json().catch(() => ({}));
          log('create-order response', orderRes.status, orderData);
          if (!orderRes.ok || !orderData?.order_number) {
            err('Order creation failed');
            if ('disabled' in checkoutEl) checkoutEl.disabled = false;
            isSubmitting = false;
            return;
          }
          const checkoutPayload = {
            ...payload,
            order_number: orderData.order_number,
            payment_method: token
          };
          res = await fetch(`${apiBase}/api/checkout/authorizeNet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkoutPayload)
          });
        } else {
          res = await fetch(`${apiBase}/api/checkout/${provider}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch (error) {
        console.error('[Smoothr Checkout] ❌ Fetch failed:', error);
        throw error;
      }
      const data = await res.clone().json().catch(() => ({}));
      log('fetch response', res.status, data);
      console.log('[Smoothr Checkout] fetch response', res.status, data);
      if (res.status === 403) {
        console.warn('[Smoothr Auth] Supabase session missing or expired');
      }
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
      console.error(error);
      err(`\u274C ${error.message}`);
      if (!hasShownCheckoutError) {
        alert('Failed to start checkout');
        hasShownCheckoutError = true;
      }
    } finally {
      if ('disabled' in checkoutEl) checkoutEl.disabled = false;
      isSubmitting = false;
      log('submit handler complete');
    }
  });
  log(`${eventName} handler attached`);
}

document.addEventListener('DOMContentLoaded', initCheckout);
if (document.readyState !== 'loading') {
  initCheckout();
}
