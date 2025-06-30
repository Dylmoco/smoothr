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
          el.src = item.image || '';
          el.alt = item.name || '';
        } else {
          el.style.backgroundImage = `url(${item.image || ''})`;
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
      const shipping = {
        line1: document.querySelector('[data-smoothr-shipping-line1]')?.value?.trim() || '',
        line2: document.querySelector('[data-smoothr-shipping-line2]')?.value?.trim() || '',
        city: document.querySelector('[data-smoothr-shipping-city]')?.value?.trim() || '',
        postcode: document.querySelector('[data-smoothr-shipping-postcode]')?.value?.trim() || '',
        state: document.querySelector('[data-smoothr-shipping-state]')?.value?.trim() || '',
        country: document.querySelector('[data-smoothr-shipping-country]')?.value?.trim() || ''
      };

      const cart = Smoothr.cart.getCart();
      const total = Smoothr.cart.getTotal();
      const currency = window.SMOOTHR_CONFIG?.baseCurrency || 'USD';

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

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { name: `${first_name} ${last_name}`, email }
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
        currency
      };

      console.log('[Smoothr Checkout] Submitting payload:', payload);
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
