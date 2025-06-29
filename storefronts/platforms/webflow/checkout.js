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

  const checkoutBtn = document.querySelector('[data-smoothr-checkout]');
  checkoutBtn?.addEventListener('click', async () => {
    if (!window.SMOOTHR_CONFIG?.baseCurrency) {
      alert('Base currency not configured');
      return;
    }
    checkoutBtn.disabled = true;
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseCurrency: window.SMOOTHR_CONFIG.baseCurrency,
          cart: Smoothr.cart.getCart()
        })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
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
