import { describe, it, expect, beforeEach, vi } from 'vitest';

let domReadyCb;
let clickHandler;

beforeEach(() => {
  vi.resetModules();
  domReadyCb = null;
  clickHandler = null;

  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
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
  const submitBtn = {
    disabled: false,
    addEventListener: vi.fn((ev, cb) => {
      if (ev === 'click') clickHandler = cb;
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
        '[data-smoothr-submit]': submitBtn,
        '[data-smoothr-card-number]': cardNumberEl,
        '[data-smoothr-card-expiry]': cardExpiryEl,
        '[data-smoothr-card-cvc]': cardCvcEl,
        '[data-smoothr-postal]': { value: '12345' },
        '[data-smoothr-ship-line1]': { value: '' },
        '[data-smoothr-ship-line2]': { value: '' },
        '[data-smoothr-ship-city]': { value: '' },
        '[data-smoothr-ship-postal]': { value: '' },
        '[data-smoothr-ship-state]': { value: '' },
        '[data-smoothr-ship-country]': { value: '' }
      };
      return map[sel] || null;
    })
  };

  global.document = {
    querySelector: vi.fn(sel => {
      const map = {
        '[data-smoothr-checkout]': block,
        '[data-smoothr-card-number]': cardNumberEl,
        '[data-smoothr-card-expiry]': cardExpiryEl,
        '[data-smoothr-card-cvc]': cardCvcEl,
        '#smoothr-checkout-theme': null
      };
      return map[sel] || null;
    }),
    addEventListener: vi.fn((ev, cb) => {
      if (ev === 'DOMContentLoaded') domReadyCb = cb;
    })
  };

  global.window = {
    SMOOTHR_CONFIG: { stripeKey: 'pk_test', baseCurrency: 'USD' },
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
});

describe('checkout payload', () => {
  it('sends expected data to fetch', async () => {
    await import('../../checkout/checkout.js');
    domReadyCb && domReadyCb();

    await clickHandler({ preventDefault: vi.fn(), stopPropagation: vi.fn() });

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
  });
});
