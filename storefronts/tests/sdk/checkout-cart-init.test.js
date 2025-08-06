import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
const loadScriptPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../utils/loadScriptOnce.js'
);

// Test 1: verify only active gateway module and script load

describe('checkout gateway loading', () => {
  let loadScriptOnce;

  beforeEach(async () => {
    vi.resetModules();
    document.head.innerHTML = '';
    document.body.innerHTML = '<button data-smoothr="pay"></button>';

    loadScriptOnce = vi.fn(() => Promise.resolve());
    vi.doMock(loadScriptPath, () => ({ loadScriptOnce }));

    window.SMOOTHR_CONFIG = {};
    window.Smoothr = { cart: {} };
  });

  it('loads only the active gateway script', async () => {
    const { init } = await import('../../features/checkout/init.js');
    await init({ settings: { active_payment_gateway: 'stripe' } });
    expect(typeof window.Smoothr.cart.checkout).toBe('function');
    expect(loadScriptOnce).toHaveBeenCalledTimes(1);
    expect(loadScriptOnce).toHaveBeenCalledWith('stripe.js', undefined);
  });
});

// Test 2: cart and checkout init idempotency

describe('cart and checkout init idempotency', () => {
  let loadScriptOnce;
  let cartBtn;
  let cartBindSpy;

  beforeEach(async () => {
    vi.resetModules();
    document.head.innerHTML = '';
    document.body.innerHTML = `
      <button id="cart" data-smoothr="add-to-cart" data-product-id="1" data-product-name="Test" data-product-price="1"></button>
      <button id="pay" data-smoothr="pay"></button>
    `;
    cartBtn = document.getElementById('cart');
    cartBindSpy = vi.spyOn(cartBtn, 'addEventListener');

    loadScriptOnce = vi.fn(() => Promise.resolve());
    vi.doMock(loadScriptPath, () => ({ loadScriptOnce }));

    window.SMOOTHR_CONFIG = {};
    window.Smoothr = { cart: {} };
  });

  it('does not duplicate scripts or bindings when init called twice', async () => {
    const cartMod = await import('../../features/cart/init.js');
    const checkoutMod = await import('../../features/checkout/init.js');

    await cartMod.init();
    await cartMod.init();
    expect(cartBindSpy).toHaveBeenCalledTimes(1);

    await checkoutMod.init({ settings: { active_payment_gateway: 'stripe' } });
    const firstCheckout = window.Smoothr.cart.checkout;
    await checkoutMod.init({ settings: { active_payment_gateway: 'stripe' } });
    expect(window.Smoothr.cart.checkout).toBe(firstCheckout);
    expect(loadScriptOnce).toHaveBeenCalledTimes(1);
  });
});

