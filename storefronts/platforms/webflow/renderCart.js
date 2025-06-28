export function renderCart() {
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
    el.setAttribute('data-smoothr-total', total);
    if (formatter) {
      el.textContent = formatter(total);
    } else {
      el.textContent = String(total);
    }
  });

  document.querySelectorAll('[data-smoothr-cart]').forEach(container => {
    container.innerHTML = '';
    cart.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'smoothr-cart-item';

      const name = document.createElement('div');
      name.textContent = item.name || '';
      row.appendChild(name);

      if (item.options) {
        const opts = document.createElement('div');
        if (Array.isArray(item.options)) {
          opts.textContent = item.options.join(', ');
        } else if (typeof item.options === 'object') {
          opts.textContent = Object.values(item.options).join(', ');
        } else {
          opts.textContent = item.options;
        }
        row.appendChild(opts);
      }

      const qty = document.createElement('div');
      qty.textContent = String(item.quantity);
      row.appendChild(qty);

      const sub = document.createElement('div');
      const subtotal = item.price * item.quantity;
      sub.textContent = formatter ? formatter(subtotal) : String(subtotal);
      row.appendChild(sub);

      const remove = document.createElement('button');
      remove.setAttribute('data-smoothr-remove', item.product_id);
      remove.textContent = 'Remove';
      row.appendChild(remove);

      container.appendChild(row);
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
