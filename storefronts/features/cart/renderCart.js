import { getConfig } from '../config/globalConfig.js';

export function hideTemplatesGlobally() {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll('[data-smoothr-template]')
    .forEach(el => (el.style.display = 'none'));
}

export function formatCartPrice(baseAmount, Smoothr, currency) {
  const code =
    currency ||
    Smoothr?.currency?.getCurrency?.() ||
    Smoothr?.currency?.baseCurrency ||
    'USD';
  const displayAmount = Smoothr?.currency?.convertPrice
    ? Smoothr.currency.convertPrice(baseAmount, code)
    : baseAmount;
  const text = Smoothr?.currency?.formatPrice
    ? Smoothr.currency.formatPrice(displayAmount, code)
    : String(displayAmount);
  return { displayAmount, text };
}

export function bindRemoveFromCartButtons() {
  if (typeof document === 'undefined') return;
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart) return;

  document
    .querySelectorAll('[data-smoothr="remove-from-cart"]')
    .forEach(btn => {
      if (btn.__smoothrBound) return;
      const id = btn.getAttribute('data-product-id');
      btn.addEventListener('click', async () => {
      await Smoothr.cart.removeItem(id);
      if (typeof Smoothr.cart.renderCart === 'function') {
        await Smoothr.cart.renderCart();
      }
      });
      btn.__smoothrBound = true;
    });
}

export function renderCart() {
  const { debug } = getConfig();
  if (debug) console.log('🎨 renderCart() triggered');
  if (typeof document === 'undefined') return;
  setTimeout(() => hideTemplatesGlobally(), 50);
  const Smoothr = window.Smoothr || window.smoothr;
  if (!Smoothr?.cart) return;

  const cart = Smoothr.cart.getCart();
  const total = Smoothr.cart.getSubtotal?.() || 0;
  const currency =
    Smoothr?.currency?.getCurrency?.() ||
    Smoothr?.currency?.baseCurrency ||
    'USD';

  document.querySelectorAll('[data-smoothr-total]').forEach(el => {
    const baseTotal = total / 100;
    const { displayAmount, text } = formatCartPrice(baseTotal, Smoothr, currency);
    el.dataset.smoothrBase = baseTotal;
    el.setAttribute('data-smoothr-total', displayAmount);
    el.textContent = text;
  });

  document.querySelectorAll('[data-smoothr-cart]').forEach(container => {
    container.querySelectorAll('.cart-rendered').forEach(el => el.remove());

    const template = container.querySelector('[data-smoothr-template]');
    if (!template) {
      if (debug)
        console.warn('renderCart: no [data-smoothr-template] found', container);
      return;
    }

    template.style.display = 'none';

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

      clone
        .querySelectorAll('[data-smoothr-qty], [data-smoothr-quantity]')
        .forEach(el => {
          el.textContent = String(Math.max(1, +item.quantity || 1));
        });

      clone
        .querySelectorAll('[data-smoothr="qty-plus"],[data-smoothr="qty-minus"]')
        .forEach(btn => {
          btn.setAttribute('data-product-id', item.product_id);
        });
      clone
        .querySelectorAll('[data-smoothr-qty="+"],[data-smoothr-qty="-"]')
        .forEach(btn => {
          btn.setAttribute('data-product-id', item.product_id);
        });

      clone.querySelectorAll('[data-smoothr-price]').forEach(el => {
        const basePrice = item.price / 100;
        const { displayAmount, text } = formatCartPrice(
          basePrice,
          Smoothr,
          currency
        );
        el.dataset.smoothrBase = basePrice;
        el.setAttribute('data-smoothr-price', displayAmount);
        el.textContent = text;
      });

      clone.querySelectorAll('[data-smoothr-subtotal]').forEach(el => {
        const baseSubtotal = (item.price * item.quantity) / 100;
        const { displayAmount, text } = formatCartPrice(
          baseSubtotal,
          Smoothr,
          currency
        );
        el.dataset.smoothrBase = baseSubtotal;
        el.setAttribute('data-smoothr-subtotal', displayAmount);
        el.textContent = text;
      });

      const imageEl = clone.querySelector('[data-smoothr-image]');
      if (imageEl) {
        if (imageEl.tagName === 'IMG') {
          if (item.image) {
            imageEl.src = item.image;
          } else {
            imageEl.removeAttribute('src');
          }
          imageEl.alt = item.name || '';
        } else {
          imageEl.style.backgroundImage = item.image
            ? `url(${item.image})`
            : '';
        }
      }

      clone.querySelectorAll('[data-smoothr="remove-from-cart"]').forEach(
        btn => {
          btn.setAttribute('data-product-id', item.product_id);
          if (!btn.__smoothrBound) {
            btn.addEventListener('click', async () => {
              await Smoothr.cart.removeItem(item.product_id);
              if (typeof Smoothr.cart.renderCart === 'function') {
                await Smoothr.cart.renderCart();
              }
            });
            btn.__smoothrBound = true;
          }
        }
      );

      template.parentNode.insertBefore(clone, template.nextSibling);
    });
  });

  bindRemoveFromCartButtons();
}


