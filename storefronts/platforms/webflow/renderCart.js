export function renderCart() {
  const debug = window.SMOOTHR_CONFIG?.debug;
  if (debug) console.log('🎨 renderCart() triggered');
  if (typeof document === 'undefined') return;
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart) return;

  const cart = Smoothr.cart.getCart();
  const total = Smoothr.cart.getTotal();
  const formatter =
    Smoothr.currency?.format ||
    Smoothr.currency?.formatPrice ||
    Smoothr.currency?.formatCurrency;

  document.querySelectorAll('[data-smoothr-total]').forEach(el => {
    const displayTotal = total / 100;
    el.setAttribute('data-smoothr-total', displayTotal);
    if (formatter) {
      el.textContent = formatter(displayTotal);
    } else {
      el.textContent = String(displayTotal);
    }
  });

  document.querySelectorAll('[data-smoothr-cart]').forEach(container => {
    container.querySelectorAll('.cart-rendered').forEach(el => el.remove());

    const template = container.querySelector('[data-smoothr-template]');
    if (!template) {
      if (debug)
        console.warn('renderCart: no [data-smoothr-template] found', container);
      return;
    }

    cart.items.forEach(item => {
      const clone = template.cloneNode(true);
      clone.classList.add('cart-rendered', 'smoothr-cart-rendered');
      clone.removeAttribute('data-smoothr-template');
      clone.style.display = '';

      clone.querySelectorAll('[data-smoothr-name]').forEach(el => {
        el.textContent = item.name || '';
      });

      clone.querySelectorAll('[data-smoothr-options]').forEach(el => {
        if (item.options) {
          if (Array.isArray(item.options)) {
            el.textContent = item.options.join(', ');
          } else if (typeof item.options === 'object') {
            el.textContent = Object.values(item.options).join(', ');
          } else {
            el.textContent = item.options;
          }
        }
      });

      clone.querySelectorAll('[data-smoothr-quantity]').forEach(el => {
        el.textContent = String(item.quantity);
      });

      clone.querySelectorAll('[data-smoothr-price]').forEach(el => {
        const displayPrice = item.price / 100;
        el.setAttribute('data-smoothr-price', displayPrice);
        if (formatter) {
          el.textContent = formatter(displayPrice);
        } else {
          el.textContent = String(displayPrice);
        }
      });

      clone.querySelectorAll('[data-smoothr-subtotal]').forEach(el => {
        const subtotal = (item.price * item.quantity) / 100;
        el.setAttribute('data-smoothr-subtotal', subtotal);
        el.textContent = formatter ? formatter(subtotal) : String(subtotal);
      });

      const imageEl = clone.querySelector('[data-smoothr-image]');
      if (imageEl) {
        if (imageEl.tagName === 'IMG') {
          imageEl.src = item.image || '';
          imageEl.alt = item.name || '';
        } else {
          imageEl.style.backgroundImage = `url(${item.image || ''})`;
        }
      }

      clone.querySelectorAll('[data-smoothr-remove]').forEach(btn => {
        btn.setAttribute('data-smoothr-remove', item.product_id);
        if (!btn.__smoothrBound) {
          btn.addEventListener('click', () => Smoothr.cart.removeItem(item.product_id));
          btn.__smoothrBound = true;
        }
      });

      template.parentNode.insertBefore(clone, template.nextSibling);
    });
  });

  document.querySelectorAll('[data-smoothr-remove]').forEach(btn => {
    if (btn.__smoothrBound) return;
    const id = btn.getAttribute('data-smoothr-remove');
    btn.addEventListener('click', () => Smoothr.cart.removeItem(id));
    btn.__smoothrBound = true;
  });
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', renderCart);
  window.addEventListener('smoothr:cart:updated', renderCart);
  window.renderCart = renderCart;
}
