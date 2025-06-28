import { describe, it, expect, beforeEach, vi } from 'vitest';

let container;
let template;
let totalEl;
let removeItemMock;
let Smoothr;

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';

  // create cart container and template
  container = document.createElement('div');
  container.setAttribute('data-smoothr-cart', '');

  template = document.createElement('div');
  template.setAttribute('data-smoothr-template', '');

  const nameEl = document.createElement('span');
  nameEl.setAttribute('data-smoothr-name', '');

  const optionsEl = document.createElement('span');
  optionsEl.setAttribute('data-smoothr-options', '');

  const qtyEl = document.createElement('span');
  qtyEl.setAttribute('data-smoothr-quantity', '');

  const priceEl = document.createElement('span');
  priceEl.setAttribute('data-smoothr-price', '');

  const subtotalEl = document.createElement('span');
  subtotalEl.setAttribute('data-smoothr-subtotal', '');

  const removeBtn = document.createElement('button');
  removeBtn.setAttribute('data-smoothr-remove', '');

  template.append(nameEl, optionsEl, qtyEl, priceEl, subtotalEl, removeBtn);
  container.appendChild(template);
  document.body.appendChild(container);

  totalEl = document.createElement('span');
  totalEl.setAttribute('data-smoothr-total', '');
  document.body.appendChild(totalEl);

  removeItemMock = vi.fn();

  Smoothr = {
    cart: {
      getCart: () => ({
        items: [
          {
            product_id: 'p1',
            name: 'Item One',
            price: 100,
            quantity: 2,
            options: { size: 'M' },
            image: 'img1.jpg'
          },
          {
            product_id: 'p2',
            name: 'Item Two',
            price: 50,
            quantity: 1,
            options: { size: 'L' },
            image: 'img2.jpg'
          }
        ]
      }),
      getTotal: () => 250,
      removeItem: removeItemMock
    }
  };

  window.Smoothr = Smoothr;
});

async function loadRenderCart() {
  const mod = await import('../webflow/renderCart.js');
  return mod.renderCart;
}

describe('renderCart', () => {
  it('inserts clones for cart items', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const clones = container.querySelectorAll('.cart-rendered');
    expect(clones.length).toBe(2);
  });

  it('populates template bindings with item data', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const clone = container.querySelector('.cart-rendered');
    expect(clone.querySelector('[data-smoothr-name]').textContent).toBe('Item One');
    expect(clone.querySelector('[data-smoothr-quantity]').textContent).toBe('2');
    expect(clone.querySelector('[data-smoothr-price]').textContent).toBe('100');
    expect(clone.querySelector('[data-smoothr-subtotal]').textContent).toBe('200');
    expect(totalEl.textContent).toBe('250');
  });

  it('remove buttons trigger cart.removeItem', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const btn = container.querySelector('[data-smoothr-remove]');
    btn.click();
    expect(removeItemMock).toHaveBeenCalledWith('p1');
  });
});
