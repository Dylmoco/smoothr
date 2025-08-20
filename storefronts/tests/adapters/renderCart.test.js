import { describe, it, expect, beforeEach, vi } from 'vitest';
import { init as initSDK } from '../../features/currency/init.js';

let container;
let template;
let totalEl;
let removeItemMock;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';

  // create cart container and template
  container = document.createElement('div');
  container.setAttribute('data-smoothr-cart', '');

  template = document.createElement('div');
  template.setAttribute('data-smoothr-template', '');
  template.style.display = 'none';

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

  const imageEl = document.createElement('img');
  imageEl.setAttribute('data-smoothr-image', '');

  const removeBtn = document.createElement('button');
  removeBtn.setAttribute('data-smoothr', 'remove-from-cart');

  template.append(
    imageEl,
    nameEl,
    optionsEl,
    qtyEl,
    priceEl,
    subtotalEl,
    removeBtn
  );
  container.appendChild(template);
  document.body.appendChild(container);

  totalEl = document.createElement('span');
  totalEl.setAttribute('data-smoothr-total', '');
  document.body.appendChild(totalEl);

  removeItemMock = vi.fn();

  window.SMOOTHR_CONFIG = { baseCurrency: 'USD' };
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
  );
  global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
  await initSDK({ baseCurrency: 'USD' });

  window.Smoothr.cart = {
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
          options: { size: 'L' }
        }
      ]
    }),
    getSubtotal: () => 250,
    removeItem: removeItemMock
  };
});

async function loadRenderCart() {
  const mod = await import('../../features/cart/renderCart.js');
  return mod.renderCart;
}

describe('renderCart', () => {
  it('inserts clones for cart items', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const clones = container.querySelectorAll('.cart-rendered');
    expect(clones.length).toBe(2);
  });

  it('clones remove template attribute and show rows', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const clone = container.querySelector('.cart-rendered');
    expect(clone.hasAttribute('data-smoothr-template')).toBe(false);
    expect(clone.style.display).toBe('');
    expect(template.style.display).toBe('none');
  });

  it('populates template bindings with item data', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const clone = container.querySelector('.cart-rendered');
    expect(clone.querySelector('[data-smoothr-name]').textContent).toBe('Item Two');
    expect(clone.querySelector('[data-smoothr-quantity]').textContent).toBe('1');
    expect(clone.querySelector('[data-smoothr-price]').textContent).toBe('$0.50');
    expect(clone.querySelector('[data-smoothr-subtotal]').textContent).toBe('$0.50');
    expect(totalEl.textContent).toBe('$2.50');
  });

  it('remove buttons trigger cart.removeItem', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const btn = container.querySelector(
      '.cart-rendered [data-smoothr="remove-from-cart"]'
    );
    btn.click();
    expect(removeItemMock).toHaveBeenCalledWith('p2');
  });

  it('sets image src and alt when provided', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const clone = container.querySelectorAll('.cart-rendered')[1];
    const img = clone.querySelector('[data-smoothr-image]');
    expect(img.getAttribute('src')).toBe('img1.jpg');
    expect(img.alt).toBe('Item One');
  });

  it('handles missing image gracefully', async () => {
    const renderCart = await loadRenderCart();
    renderCart();
    const first = container.querySelectorAll('.cart-rendered')[0];
    const img = first.querySelector('[data-smoothr-image]');
    expect(img.getAttribute('src')).toBeNull();
    expect(img.alt).toBe('Item Two');
  });
});
