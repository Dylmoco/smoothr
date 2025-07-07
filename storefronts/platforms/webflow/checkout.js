import gateways from '../../checkout/gateways/index.js';
import * as stripeGateway from '../../checkout/gateways/stripe.js';
import supabase from '../../../supabase/supabaseClient.js';

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);

async function getPublicCredential(storeId, integrationId) {
  if (!storeId || !integrationId) return null;
  try {
    console.log('[debug] Fetching store_integrations for storeId:', storeId);
    const { data, error } = await supabase
      .from('store_integrations')
      .select('api_key, settings')
      .eq('store_id', storeId)
      .eq('provider', integrationId)
      .maybeSingle();
    console.log('[debug] store_integrations response', { credsData: data, credsError: error });
    if (error) {
      warn('Credential lookup failed:', error.message || error);
      return null;
    }
    return data;
  } catch (e) {
    warn('Credential fetch error:', e?.message || e);
    return null;
  }
}

async function getActivePaymentGateway() {
  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.active_payment_gateway) return cfg.active_payment_gateway;
  const storeId = cfg.storeId;
  if (!storeId) return 'stripe';
  try {
    console.log('[debug] Fetching store_settings for storeId:', storeId);
    const { data, error } = await supabase
      .from('store_settings')
      .select('settings')
      .eq('store_id', storeId)
      .maybeSingle();
    console.log('[debug] store_settings response', { settingsData: data, settingsError: error });
    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return 'stripe';
    }
    return data?.settings?.active_payment_gateway || 'stripe';
  } catch (e) {
    warn('Gateway lookup failed:', e?.message || e);
    return 'stripe';
  }
}


function hideTemplatesGlobally() {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll('[data-smoothr-template]')
    .forEach(el => (el.style.display = 'none'));
}


export async function initCheckout() {
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart) return;
  

  const cart = Smoothr.cart.getCart();
  const list = document.querySelector('[data-smoothr-list]');
  const template = list?.querySelector('[data-smoothr-template]');

  if (list && template) {
    // Hide template row to avoid showing it alongside cloned items
    template.style.display = 'none';
    // clear previous items
    list.querySelectorAll('.smoothr-checkout-item').forEach(el => el.remove());

    cart.items.forEach(item => {
      const clone = template.cloneNode(true);
      clone.classList.add('smoothr-checkout-item');
      clone.removeAttribute('data-smoothr-template');
      clone.style.display = '';

      clone.querySelectorAll('[data-smoothr-name]').forEach(el => {
        el.textContent = item.name || '';
      });

      clone.querySelectorAll('[data-smoothr-price]').forEach(el => {
        const price = item.price / 100;
        const converted = Smoothr.currency?.convertPrice
          ? Smoothr.currency.convertPrice(price)
          : price;
        el.textContent = String(converted);
      });

      clone.querySelectorAll('[data-smoothr-image]').forEach(el => {
        if (el.tagName === 'IMG') {
          if (item.image) {
            el.src = item.image;
          } else {
            el.removeAttribute('src');
          }
          el.alt = item.name || '';
        } else {
          el.style.backgroundImage = item.image ? `url(${item.image})` : '';
        }
      });

      clone.querySelectorAll('[data-smoothr-quantity]').forEach(el => {
        el.textContent = String(item.quantity);
      });

      list.appendChild(clone);
    });
  }

  const subtotalEl = document.querySelector('[data-smoothr-subtotal]');
  const totalEl = document.querySelector('[data-smoothr-total]');

  if (subtotalEl && totalEl) {
    const baseSubtotal = Smoothr.cart.getTotal() / 100;
    const convertedSubtotal = Smoothr.currency?.convertPrice
      ? Smoothr.currency.convertPrice(baseSubtotal)
      : baseSubtotal;
    subtotalEl.textContent = String(convertedSubtotal);
    totalEl.textContent = String(convertedSubtotal);
  }

  const activeGateway = await getActivePaymentGateway();
  console.log('[Smoothr Checkout] Using gateway:', activeGateway);
  const gateway = gateways[activeGateway];
  if (!gateway) {
    warn('Unknown payment gateway:', activeGateway);
    return;
  }

  // expose selected gateway helpers on window
  window.Smoothr.checkout = Object.assign(
    {},
    window.Smoothr.checkout,
    gateway,
    { version: 'dev6' }
  );

  await gateway.mountCardFields();

  document.querySelectorAll('[data-smoothr-checkout]').forEach(checkoutBtn => {
    if (checkoutBtn.__smoothrBound) return;
    checkoutBtn.__smoothrBound = true;

    checkoutBtn.addEventListener('click', async () => {
      if (checkoutBtn.disabled) {
        warn('Checkout blocked: already in progress');
        return;
      }

        if (activeGateway === 'stripe') {
          try {
            const { elements: els } = await stripeGateway.getElements();
            if (!els) {
              alert('Stripe key not configured');
              checkoutBtn.disabled = false;
              checkoutBtn.classList.remove('loading');
              return;
            }
        } catch (err) {
          warn('Stripe init failed:', err?.message || err);
          alert('Stripe key not configured');
          checkoutBtn.disabled = false;
          checkoutBtn.classList.remove('loading');
          return;
        }
      }

      checkoutBtn.disabled = true;
      checkoutBtn.classList.add('loading');

    try {
      const email = document.querySelector('[data-smoothr-email]')?.value?.trim() || '';
      const first_name = document.querySelector('[data-smoothr-first-name]')?.value?.trim() || '';
      const last_name = document.querySelector('[data-smoothr-last-name]')?.value?.trim() || '';
      const line1 = document.querySelector('[data-smoothr-ship-line1]')?.value?.trim() || '';
      const line2 = document.querySelector('[data-smoothr-ship-line2]')?.value?.trim() || '';
      const city = document.querySelector('[data-smoothr-ship-city]')?.value?.trim() || '';
      const state = document.querySelector('[data-smoothr-ship-state]')?.value?.trim() || '';
      const postal_code = document.querySelector('[data-smoothr-ship-postal]')?.value?.trim() || '';
      const country = document.querySelector('[data-smoothr-ship-country]')?.value?.trim() || '';
      const shipping = {
        name: `${first_name} ${last_name}`,
        address: { line1, line2, city, state, postal_code, country }
      };

      const billing_first_name = document.querySelector('[data-smoothr-bill-first-name]')?.value?.trim() || '';
      const billing_last_name = document.querySelector('[data-smoothr-bill-last-name]')?.value?.trim() || '';
      const billing_line1 = document.querySelector('[data-smoothr-bill-line1]')?.value?.trim() || '';
      const billing_line2 = document.querySelector('[data-smoothr-bill-line2]')?.value?.trim() || '';
      const billing_city = document.querySelector('[data-smoothr-bill-city]')?.value?.trim() || '';
      const billing_state = document.querySelector('[data-smoothr-bill-state]')?.value?.trim() || '';
      const billing_postal = document.querySelector('[data-smoothr-bill-postal]')?.value?.trim() || '';
      const billing_country = document.querySelector('[data-smoothr-bill-country]')?.value?.trim() || '';
      const billing_details = {
        name: `${billing_first_name} ${billing_last_name}`.trim(),
        email,
        address: {
          line1: billing_line1,
          line2: billing_line2,
          city: billing_city,
          state: billing_state,
          postal_code: billing_postal,
          country: billing_country
        }
      };

      const requiredBilling = [billing_first_name, billing_last_name, billing_line1, billing_city, billing_postal, billing_country];
      const anyBillingFilled = requiredBilling.concat(billing_line2, billing_state).some(f => f);
      const allBillingFilled = requiredBilling.every(f => f);
        if (anyBillingFilled && !allBillingFilled) {
          warn('Incomplete billing details provided');
        }

      const cart = Smoothr.cart.getCart();
      const total = Smoothr.cart.getTotal();
      const currency = window.SMOOTHR_CONFIG?.baseCurrency || 'USD';
      const customer_id = window.smoothr?.auth?.user?.id || null;
      const store_id = window.SMOOTHR_CONFIG?.storeId;
      const platform = 'webflow';

      const isValid = !!(email && first_name && last_name && total);
      log('Validation state', {
        email,
        first_name,
        last_name,
        total,
        isValid
      });

      const missing = [];
      if (!email) missing.push('email');
      if (!first_name) missing.push('first_name');
      if (!last_name) missing.push('last_name');
      if (!total) missing.push('total');

      if (!isValid && !window.SMOOTHR_CONFIG?.disableFrontendValidation) {
        warn('Missing required fields:', missing);
        alert('Missing required fields');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('loading');
        return;
      }

      if (!gateway.isMounted()) await gateway.mountCardFields();
      if (!gateway.ready()) {
        alert('Payment form not ready');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('loading');
        return;
      }

      log('billing_details:', billing_details);
      log('shipping:', shipping);
        const {
          error: pmError,
          paymentMethod,
          payment_method
        } = await gateway.createPaymentMethod(billing_details);

        const token = payment_method || paymentMethod;

        if (pmError || !token) {
          alert('Failed to create payment method');
          checkoutBtn.disabled = false;
          checkoutBtn.classList.remove('loading');
          return;
        }

      const payload = {
        email,
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

        if (activeGateway === 'stripe') {
          payload.payment_method = token.id;
        } else if (activeGateway === 'authorizeNet') {
          payload.payment_method = token;
        } else if (activeGateway === 'nmi') {
          Object.assign(payload, token);
        } else {
          payload.payment_method = token.id;
        }

        log('Submitting payload:', payload);
        log('billing_details:', billing_details);
        log('shipping:', shipping);
      const base = window?.SMOOTHR_CONFIG?.apiBase || '';
      const res = await fetch(`${base}/api/checkout/${activeGateway}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        Smoothr.cart.clearCart?.();
        window.location.href = '/checkout-success';
      } else {
        alert('Failed to start checkout');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('loading');
      }
    } catch (err) {
      alert('Failed to start checkout');
      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove('loading');
    }
  });

  if (!cart.items.length) {
    subtotalEl?.closest('[data-smoothr-totals]')?.classList.add('hidden');
    const emptyEl = document.querySelector('[data-smoothr-empty]');
    if (emptyEl) emptyEl.style.display = '';
  }
  });
}

document.addEventListener('DOMContentLoaded', initCheckout);
if (document.readyState !== 'loading') {
  initCheckout();
}

window.Smoothr = window.Smoothr || {};
window.Smoothr.checkout = { version: 'dev6' };

async function submitGatewayPayment() {
  const activeGateway = await getActivePaymentGateway();
  const gateway = gateways[activeGateway];
  if (!gateway) {
    warn('Unknown payment gateway:', activeGateway);
    return;
  }
  if (!gateway.isMounted?.()) {
    await gateway.mountCardFields?.();
  }
  await gateway.createPaymentMethod();
}

window.__SMOOTHR_DEBUG__ = window.__SMOOTHR_DEBUG__ || {};
window.__SMOOTHR_DEBUG__.submitGatewayPayment = submitGatewayPayment;

window.__SMOOTHR_DEBUG__ = window.__SMOOTHR_DEBUG__ || {};
window.__SMOOTHR_DEBUG__.submitCheckout = () => {
  console.log('[Authorize.Net] \u{1F501} Submit triggered');
  window.__SMOOTHR_DEBUG__.submitGatewayPayment?.();
};

window.addEventListener('DOMContentLoaded', () => {
  const checkoutButton = document.querySelector('[data-smoothr-checkout]');
  if (checkoutButton) {
    console.log('[Smoothr] \u2705 Binding checkout button');
    checkoutButton.addEventListener('click', () => {
      console.log('[Smoothr] \u{1F7E2} Button clicked \u2013 running submitCheckout');
      window.__SMOOTHR_DEBUG__.submitCheckout?.();
    });
  } else {
    console.warn('[Smoothr] \u274C [data-smoothr-checkout] not found');
  }
});
