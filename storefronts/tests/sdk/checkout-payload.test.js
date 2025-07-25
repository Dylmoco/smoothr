import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function flushPromises() {
  return new Promise(setImmediate);
}

let domReadyCb;
let submitBtn;
let originalDocument;
let originalFetch;
let clickHandler;

beforeEach(() => {
  vi.resetModules();
  domReadyCb = null;
  clickHandler = null;

  delete global.window?.__SMOOTHR_CHECKOUT_INITIALIZED__;
  delete global.window?.__SMOOTHR_CHECKOUT_BOUND__;

  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };

  originalFetch = global.fetch;

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
      clone: () => ({ json: () => Promise.resolve({ success: true }) })
    })
  );

  const cardElement = { mount: vi.fn() };
  const elementsMock = { create: vi.fn(() => cardElement) };
  global.Stripe = vi.fn(() => ({
    elements: vi.fn(() => elementsMock),
    createPaymentMethod: vi.fn(() =>
      Promise.resolve({ paymentMethod: { id: 'pm_123' } })
    )
  }));

  const emailInput = { value: 'user@example.com', getAttribute: vi.fn() };
  const firstNameInput = { value: 'Jane' };
  const lastNameInput = { value: 'Doe' };
  const totalEl = { textContent: '$50.00' };
  const cardNumberEl = {};
  const cardExpiryEl = {};
  const cardCvcEl = {};
  submitBtn = {
    disabled: false,
    addEventListener: vi.fn((ev, cb) => {
      if (ev === 'click' || ev === 'submit') clickHandler = cb;
    })
  };
  const block = {
    dataset: { smoothrProductId: 'prod1' },
    querySelector: vi.fn(sel => {
      const map = {
        '[data-smoothr-email]': emailInput,
        '[data-smoothr-first-name]': firstNameInput,
        '[data-smoothr-last-name]': lastNameInput,
        '[data-smoothr-total]': totalEl,
        '[data-smoothr-gateway]': {},
        '[data-smoothr-pay]': submitBtn,
        '[data-smoothr-card-number]': cardNumberEl,
        '[data-smoothr-card-expiry]': cardExpiryEl,
        '[data-smoothr-card-cvc]': cardCvcEl,
        '[data-smoothr-bill-postal]': { value: '12345' },
        '[data-smoothr-ship-line1]': { value: '' },
        '[data-smoothr-ship-line2]': { value: '' },
        '[data-smoothr-ship-city]': { value: '' },
        '[data-smoothr-ship-postal]': { value: '' },
        '[data-smoothr-ship-state]': { value: '' },
        '[data-smoothr-ship-country]': { value: '' },
        '[data-smoothr-bill-first-name]': { value: 'Bill' },
        '[data-smoothr-bill-last-name]': { value: 'Buyer' },
        '[data-smoothr-bill-line1]': { value: '1 Bill St' },
        '[data-smoothr-bill-line2]': { value: 'Suite B' },
        '[data-smoothr-bill-city]': { value: 'Billtown' },
        '[data-smoothr-bill-state]': { value: 'BL' },
        '[data-smoothr-bill-postal]': { value: 'B987' },
        '[data-smoothr-bill-country]': { value: 'US' }
      };
      return map[sel] || null;
    })
  };

  submitBtn.closest = vi.fn(() => block);

  originalDocument = global.document;
  global.document = {
    querySelector: vi.fn(sel => {
      const map = {
        '[data-smoothr-pay]': submitBtn,
        '[data-smoothr-card-number]': cardNumberEl,
        '[data-smoothr-card-expiry]': cardExpiryEl,
        '[data-smoothr-card-cvc]': cardCvcEl,
        '#smoothr-checkout-theme': null
      };
      return map[sel] || null;
    }),
    querySelectorAll: vi.fn(sel => {
      if (sel === '[data-smoothr-pay]') return [submitBtn];
      return [];
    }),
    addEventListener: vi.fn((ev, cb) => {
      if (ev === 'DOMContentLoaded') domReadyCb = cb;
    })
  };

  global.window = {
    SMOOTHR_CONFIG: {
      stripeKey: 'pk_test',
      baseCurrency: 'USD',
      active_payment_gateway: 'stripe',
      apiBase: 'https://example.com'
    },
    location: { origin: '', href: '', hostname: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    Smoothr: {
      cart: {
        getCart: vi.fn(() => ({ items: [{ id: 1 }] })),
        getTotal: vi.fn(() => 5000)
      }
    }
  };
  global.window.smoothr = global.window.Smoothr;
  global.alert = global.window.alert = vi.fn();
});

afterEach(() => {
  global.document = originalDocument;
  global.fetch = originalFetch;
});

describe('checkout payload', () => {
  it('sends expected data to fetch', async () => {
    const mod = await import('../../checkout/checkout.js');
    if (domReadyCb) {
      await domReadyCb();
    }
    if (mod.initCheckout) await mod.initCheckout();
    await flushPromises();


    expect(typeof clickHandler.handleEvent).toBe('function');
    await clickHandler({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
    await flushPromises();


    expect(global.fetch).toHaveBeenCalled();
    const args = global.fetch.mock.calls[0];
    const payload = JSON.parse(args[1].body);
    expect(payload).toEqual(
      expect.objectContaining({
        email: 'user@example.com',
        payment_method: 'pm_123',
        cart: [{ id: 1 }],
        total: 5000,
        currency: 'USD'
      })
    );
    expect(payload.shipping).toEqual(
      expect.objectContaining({
        name: 'Jane Doe',
        address: expect.objectContaining({
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: ''
        })
      })
    );
    expect(payload.billing).toEqual(
      expect.objectContaining({
        name: 'Bill Buyer',
        address: expect.objectContaining({
          line1: '1 Bill St',
          line2: 'Suite B',
          city: 'Billtown',
          state: 'BL',
          postal_code: 'B987',
          country: 'US'
        })
      })
    );
  });
});
