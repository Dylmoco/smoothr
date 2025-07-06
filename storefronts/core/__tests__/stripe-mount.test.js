import { describe, it, expect, beforeEach, vi } from 'vitest';

let domReadyCb;
let cardNumberEl;
let cardExpiryEl;
let cardCvcEl;
let elementsCreate;

beforeEach(() => {
  vi.resetModules();
  domReadyCb = null;

  cardNumberEl = { mount: vi.fn() };
  cardExpiryEl = { mount: vi.fn() };
  cardCvcEl = { mount: vi.fn() };

  elementsCreate = vi.fn(type => {
    if (type === 'cardNumber') return cardNumberEl;
    if (type === 'cardExpiry') return cardExpiryEl;
    if (type === 'cardCvc') return cardCvcEl;
    return {};
  });

  global.Stripe = vi.fn(() => ({ elements: vi.fn(() => ({ create: elementsCreate })) }));

  const block = { querySelector: vi.fn(() => null), dataset: {} };

  global.document = {
    querySelector: vi.fn(sel => {
      const map = {
        '[data-smoothr-checkout]': block,
        '[data-smoothr-card-number]': {},
        '[data-smoothr-card-expiry]': {},
        '[data-smoothr-card-cvc]': {},
        '#smoothr-checkout-theme': null
      };
      return map[sel] || null;
    }),
    addEventListener: vi.fn((ev, cb) => {
      if (ev === 'DOMContentLoaded') domReadyCb = cb;
    })
  };

  global.window = {
    SMOOTHR_CONFIG: {
      stripeKey: 'pk_test',
      active_payment_gateway: 'stripe'
    },
    Smoothr: { cart: { getCart: () => ({ items: [] }), getTotal: () => 0 } }
  };
  global.window.smoothr = global.window.Smoothr;
});

describe('stripe element mounting', () => {
  it('mounts each field to its container', async () => {
    await import('../../checkout/checkout.js');
    if (domReadyCb) {
      await domReadyCb();
    }

    expect(elementsCreate).toHaveBeenCalledWith('cardNumber');
    expect(elementsCreate).toHaveBeenCalledWith('cardExpiry');
    expect(elementsCreate).toHaveBeenCalledWith('cardCvc');

    expect(cardNumberEl.mount).toHaveBeenCalledWith('[data-smoothr-card-number]');
    expect(cardExpiryEl.mount).toHaveBeenCalledWith('[data-smoothr-card-expiry]');
    expect(cardCvcEl.mount).toHaveBeenCalledWith('[data-smoothr-card-cvc]');
  });

  it('logs a warning when targets are missing', async () => {
    global.document.querySelector.mockImplementation(() => null);
    global.window.SMOOTHR_CONFIG.debug = true;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    const { mountCardFields } = await import('../../checkout/gateways/stripe.js');
    mountCardFields();
    for (let i = 0; i < 5; i++) vi.runOnlyPendingTimers();
    expect(warnSpy).toHaveBeenCalled();
    vi.useRealTimers();
    warnSpy.mockRestore();
  });
});
