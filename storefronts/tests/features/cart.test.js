import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initCart, __test_resetCart } from '../../features/cart/index.js';

describe('Cart', () => {
  beforeEach(() => {
    __test_resetCart();
    const cartData = JSON.stringify({ items: [], meta: { lastModified: Date.now() } });
    const localStorageMock = {
      getItem: vi.fn(key => (key === 'smoothr_cart' ? cartData : null)),
      setItem: vi.fn()
    };
    global.window = {
      location: { search: '' },
      localStorage: localStorageMock,
      Smoothr: { config: { store_id: '123', base_currency: 'USD' } },
      dispatchEvent: vi.fn()
    };
    globalThis.il = localStorageMock;
  });

  it('initializes empty cart', async () => {
    await initCart();
    expect(window.Smoothr.cart).toBeDefined();
    expect(window.Smoothr.cart.getCart().items).toEqual([]);
    expect(window.Smoothr.cart.getSubtotal()).toBe(0);
  });

  it('handles cart with items', async () => {
    const cartData = JSON.stringify([
      { product_id: '1', quantity: 2, price: 1000 }
    ]);
    const localStorageMock = {
      getItem: vi.fn(key => (key === 'cart' ? cartData : null)),
      setItem: vi.fn()
    };
    window.localStorage = localStorageMock;
    globalThis.il = localStorageMock;
    await initCart();
    expect(window.Smoothr.cart.getCart().items).toHaveLength(1);
    expect(window.Smoothr.cart.getSubtotal()).toBe(2000);
  });
});

