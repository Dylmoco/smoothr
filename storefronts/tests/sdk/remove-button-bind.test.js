import { describe, it, expect, beforeEach, vi } from 'vitest';

let button;

describe('remove button binding', () => {
  beforeEach(() => {
    vi.resetModules();
    button = { addEventListener: vi.fn(), getAttribute: vi.fn(() => '1') };
    global.console = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
    global.window = { Smoothr: { cart: { removeItem: vi.fn(), renderCart: vi.fn() } } };
    global.document = {
      querySelectorAll: vi.fn(sel => (sel === '[data-smoothr-remove]' ? [button] : []))
    };
  });

  it('attaches only one listener per element', async () => {
    const mod = await import('../../features/cart/renderCart.js');
    mod.bindRemoveFromCartButtons();
    mod.bindRemoveFromCartButtons();
    await button.addEventListener.mock.calls[0][1]();
    const { Smoothr } = window;
    expect(Smoothr.cart.renderCart).toHaveBeenCalled();
    expect(button.addEventListener).toHaveBeenCalledTimes(1);
  });
});
