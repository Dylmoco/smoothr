let stripe;
let elements;
let cardElement;


function initStripeElements() {
  const stripeKey = window.SMOOTHR_CONFIG?.stripeKey;
  if (!stripeKey) return;
  const target = document.querySelector('[data-smoothr-card-number]');
  if (!target) return;
  if (!stripe) {
    stripe = Stripe(stripeKey);
    elements = stripe.elements();
  }
  cardElement = elements.create('card');
  cardElement.mount(target);
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

  initStripeElements();

  const checkoutBtn = document.querySelector('[data-smoothr-checkout]');
  checkoutBtn?.addEventListener('click', async () => {
    if (!window.SMOOTHR_CONFIG?.stripeKey) {
      alert('Stripe key not configured');
      return;
    }
    checkoutBtn.disabled = true;
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
        console.warn('[Smoothr Checkout] Incomplete billing details provided');
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
        return;
      }

      if (!cardElement) initStripeElements();
      if (!stripe || !cardElement) {
        alert('Payment form not ready');
        checkoutBtn.disabled = false;
        return;
      }

      console.log('[Smoothr Checkout] billing_details:', billing_details);
      console.log('[Smoothr Checkout] shipping:', shipping);
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details
      });

      if (pmError || !paymentMethod) {
        alert('Failed to create payment method');
        checkoutBtn.disabled = false;
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

      console.log('[Smoothr Checkout] Submitting payload:', payload);
      console.log('[Smoothr Checkout] billing_details:', billing_details);
      console.log('[Smoothr Checkout] shipping:', shipping);
      const base = window?.SMOOTHR_CONFIG?.apiBase || '';
      const res = await fetch(`${base}/api/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        alert('Payment successful');
      } else {
        alert('Failed to start checkout');
      }
    } catch (err) {
      alert('Failed to start checkout');
    } finally {
      checkoutBtn.disabled = false;
    }
  });

  if (!cart.items.length) {
    subtotalEl?.closest('[data-smoothr-totals]')?.classList.add('hidden');
    const emptyEl = document.querySelector('[data-smoothr-empty]');
    if (emptyEl) emptyEl.style.display = '';
  }
}

document.addEventListener('DOMContentLoaded', initCheckout);
