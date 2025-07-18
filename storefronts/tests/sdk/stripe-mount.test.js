import { describe, it, expect, beforeEach, vi } from 'vitest';
let styleSpy = vi.fn();
vi.mock("../../checkout/gateways/forceStripeIframeStyle.js", () => ({ default: (...args) => styleSpy(...args) }));

let domReadyCb;
let cardNumberEl;
let cardExpiryEl;
let cardCvcEl;
let elementsCreate;

beforeEach(() => {
  vi.resetModules();
  styleSpy = vi.fn();
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
        '[data-smoothr-pay]': block,
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
    vi.useFakeTimers();
    const { mountCardFields } = await import('../../checkout/gateways/stripe.js');
    await mountCardFields();
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    expect(elementsCreate).toHaveBeenCalledWith(
      'cardNumber',
      expect.objectContaining({ style: expect.any(Object) })
    );
    expect(elementsCreate).toHaveBeenCalledWith(
      'cardExpiry',
      expect.objectContaining({ style: expect.any(Object) })
    );
    expect(elementsCreate).toHaveBeenCalledWith(
      'cardCvc',
      expect.objectContaining({ style: expect.any(Object) })
    );

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
    await mountCardFields();
    for (let i = 0; i < 5; i++) vi.runOnlyPendingTimers();
    expect(warnSpy).toHaveBeenCalled();
    vi.useRealTimers();
    warnSpy.mockRestore();
  });

  it('enforces iframe styles after mount', async () => {
    vi.useFakeTimers();
    const { mountCardFields } = await import('../../checkout/gateways/stripe.js');
    const p = mountCardFields();
    await vi.runAllTimersAsync();
    await p;
    vi.useRealTimers();
    expect(styleSpy).toHaveBeenCalledWith('[data-smoothr-card-number]');
    expect(styleSpy).toHaveBeenCalledWith('[data-smoothr-card-expiry]');
    expect(styleSpy).toHaveBeenCalledWith('[data-smoothr-card-cvc]');
  });

  it('waitForVisible resolves when width becomes visible', async () => {
    const { waitForVisible } = await import('../../checkout/gateways/stripe.js');
    let width = 0;
    const el = { getBoundingClientRect: vi.fn(() => ({ width })) };
    vi.useFakeTimers();
    let resolved = false;
    const p = waitForVisible(el, 1000).then(() => {
      resolved = true;
    });
    vi.advanceTimersByTime(100);
    expect(resolved).toBe(false);
    vi.advanceTimersByTime(100);
    width = 20;
    await vi.runAllTimersAsync();
    await p;
    expect(resolved).toBe(true);
    vi.useRealTimers();
  });

  it('waitForInteractable resolves when element becomes clickable', async () => {
    const { waitForInteractable } = await import('../../checkout/gateways/stripe.js');
    let width = 0;
    let offset = null;
    let active = null;
    const el = {
      getBoundingClientRect: vi.fn(() => ({ width })),
      get offsetParent() {
        return offset;
      }
    };
    Object.defineProperty(global.document, 'activeElement', {
      configurable: true,
      get: () => active
    });
    vi.useFakeTimers();
    let resolved = false;
    const p = waitForInteractable(el, 500).then(() => {
      resolved = true;
    });
    vi.advanceTimersByTime(100); // not interactable
    width = 20;
    vi.advanceTimersByTime(100); // width ok but offsetParent null
    offset = {};
    vi.advanceTimersByTime(100); // now interactable
    await vi.runAllTimersAsync();
    await p;
    expect(resolved).toBe(true);
    vi.useRealTimers();
  });
});
