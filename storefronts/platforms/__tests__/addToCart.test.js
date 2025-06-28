import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initAddToCart } from '../webflow/addToCart.js';

class CustomEvt {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
}

describe('webflow add-to-cart binding', () => {
  let btn;
  let events;
  let addItemMock;

  beforeEach(() => {
    events = {};
    btn = {
      getAttribute: vi.fn(attr => {
        switch (attr) {
          case 'data-product-id':
            return '1';
          case 'data-product-name':
            return 'Test';
          case 'data-product-price':
            return '100';
          case 'data-product-options':
            return '{"size":"L"}';
          case 'data-product-subscription':
            return 'true';
          default:
            return null;
        }
      }),
      addEventListener: vi.fn((evt, cb) => {
        if (evt === 'click') events.click = cb;
      })
    };
    addItemMock = vi.fn();
    global.document = {
      addEventListener: vi.fn((evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }),
      querySelectorAll: vi.fn(() => [btn])
    };
    global.window = {
      Smoothr: { cart: { addItem: addItemMock, getCart: vi.fn(() => ({})) } },
      dispatchEvent: vi.fn(ev => { events[ev.type]?.(ev); })
    };
    global.CustomEvent = CustomEvt;
  });

  it('binds click handler once', () => {
    initAddToCart();
    initAddToCart();
    expect(btn.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('adds item and dispatches update', () => {
    initAddToCart();
    events.click();
    expect(addItemMock).toHaveBeenCalledWith({
      product_id: '1',
      name: 'Test',
      price: 100,
      options: { size: 'L' },
      subscription: true
    });
    expect(global.window.dispatchEvent).toHaveBeenCalled();
  });
});
