import { describe, it, expect, beforeEach, vi } from 'vitest';

let button;
let removeItem;

describe('cart remove button', () => {
  beforeEach(() => {
    vi.resetModules();
    removeItem = vi.fn();
    button = {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'click') button._handler = handler;
      }),
      getAttribute: vi.fn(() => '1'),
      click: () => button._handler && button._handler()
    };
    global.window = { Smoothr: { cart: { removeItem } } };
    global.document = {
      querySelectorAll: vi.fn(sel => (sel === '[data-smoothr-remove]' ? [button] : []))
    };
  });

  it('removes items on click without double-binding', async () => {
    const mod = await import('../../features/cart/renderCart.js');
    mod.bindRemoveFromCartButtons();
    mod.bindRemoveFromCartButtons();
    button.click();
    expect(removeItem).toHaveBeenCalledTimes(1);
    expect(removeItem).toHaveBeenCalledWith('1');
  });
});
