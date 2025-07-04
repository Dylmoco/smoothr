import {
  mountCardFields,
  isMounted,
  createPaymentMethod,
  ready as gatewayReady
} from '../../checkout/gateways/stripe.js';

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Checkout]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Checkout]', ...args);


function hideTemplatesGlobally() {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll('[data-smoothr-template]')
    .forEach(el => (el.style.display = 'none'));
}


export function initCheckout() {
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

  const disclaimerText =
    'You will be charged in GBP. Displayed prices are approximate.';
  const disclaimerEl = document.querySelector('[data-smoothr-disclaimer]');
  if (disclaimerEl) {
    disclaimerEl.textContent = disclaimerText;
  } else if (totalEl) {
    const p = document.createElement('p');
    p.textContent = disclaimerText;
    totalEl.parentNode?.insertBefore(p, totalEl.nextSibling);
  }

  mountCardFields();

  document.querySelectorAll('[data-smoothr-checkout]').forEach(checkoutBtn => {
    if (checkoutBtn.__smoothrBound) return;
    checkoutBtn.__smoothrBound = true;

    checkoutBtn.addEventListener('click', async () => {
      if (checkoutBtn.disabled) {
        warn('Checkout blocked: already in progress');
        return;
      }

      if (!window.SMOOTHR_CONFIG?.stripeKey) {
        alert('Stripe key not configured');
        return;
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

      if (!email || !first_name || !last_name || !total) {
        alert('Missing required fields');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('loading');
        return;
      }

      if (!isMounted()) mountCardFields();
      if (!gatewayReady()) {
        alert('Payment form not ready');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('loading');
        return;
      }

        log('billing_details:', billing_details);
        log('shipping:', shipping);
      const { error: pmError, paymentMethod } = await createPaymentMethod(billing_details);

      if (pmError || !paymentMethod) {
        alert('Failed to create payment method');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('loading');
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

        log('Submitting payload:', payload);
        log('billing_details:', billing_details);
        log('shipping:', shipping);
      const base = window?.SMOOTHR_CONFIG?.apiBase || '';
      const res = await fetch(`${base}/api/checkout/stripe`, {
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
