import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../features/cart/addToCart.js', () => ({
  bindAddToCartButtons: vi.fn(),
}));

let cart;

beforeEach(async () => {
  vi.resetModules();
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  global.window = {
    Smoothr: {},
    document: {
      readyState: 'complete',
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
    },
  };
  global.document = window.document;
  const mod = await import('../../features/cart/init.js');
  cart = await mod.init();
  cart.renderCart = vi.fn();
});

describe('cart quantity', () => {
  it('addItem merges and increments quantity by product_id', () => {
    cart.addItem({ product_id: 'p1', price: 100, quantity: 1 });
    cart.addItem({ product_id: 'p1', price: 100, quantity: 2 });
    const items = cart.getCart().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('updateQuantity clamps to min 1 and returns boolean', () => {
    cart.addItem({ product_id: 'p1', price: 100, quantity: 2 });
    expect(cart.updateQuantity('p1', 5)).toBe(true);
    expect(cart.getCart().items[0].quantity).toBe(5);
    expect(cart.updateQuantity('p1', 0)).toBe(true);
    expect(cart.getCart().items[0].quantity).toBe(1);
    expect(cart.updateQuantity('nope', 2)).toBe(false);
  });

  it('getSubtotal honors quantity', () => {
    cart.addItem({ product_id: 'p1', price: 100, quantity: 2 });
    cart.addItem({ product_id: 'p2', price: 50, quantity: 3 });
    expect(cart.getSubtotal()).toBe(100 * 2 + 50 * 3);
  });
});

