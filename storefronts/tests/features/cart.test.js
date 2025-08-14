import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initCart } from '../../features/cart/index.js';

describe('Cart', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockImplementation((key) =>
        key === 'smoothr_cart' ? JSON.stringify({ items: [] }) : null
      ),
      setItem: vi.fn(),
    });
    vi.stubGlobal('Smoothr', {
      config: { store_id: '123', base_currency: 'USD' },
    });
  });

  it('initializes empty cart', async () => {
    await initCart();
    expect(window.Smoothr.cart).toBeDefined();
    expect(window.Smoothr.cart.getCart().items).toEqual([]);
    expect(window.Smoothr.cart.getSubtotal()).toBe(0);
  });

  it('handles cart with items', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(
        JSON.stringify({ items: [{ product_id: '1', quantity: 2, price: 1000 }] })
      ),
      setItem: vi.fn(),
    });
    await initCart();
    expect(window.Smoothr.cart.getCart().items).toHaveLength(1);
    expect(window.Smoothr.cart.getSubtotal()).toBe(2000);
  });
});

