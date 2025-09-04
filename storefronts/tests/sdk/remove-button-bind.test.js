import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDomStub } from '../utils/dom-stub';

let button;

describe('remove button binding', () => {
    let realDocument;
    beforeEach(() => {
      vi.resetModules();
      button = {
        addEventListener: vi.fn(),
        getAttribute: vi.fn(attr => (attr === 'data-product-id' ? '1' : null))
      };
      global.console = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
      global.window = { Smoothr: { cart: { removeItem: vi.fn(), renderCart: vi.fn() } } };
      realDocument = global.document;
      global.document = createDomStub({
        querySelectorAll: vi.fn(sel =>
          sel === '[data-smoothr="remove-from-cart"]' ? [button] : []
        )
      });
    });

    afterEach(() => {
      global.document = realDocument;
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
