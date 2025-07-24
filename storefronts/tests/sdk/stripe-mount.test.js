import { describe, it, expect, beforeEach, vi } from 'vitest';
let styleSpy = vi.fn();
let getCredMock;
vi.mock('../../../utils/iframeStyles.js', () => ({
  default: (...args) => styleSpy(...args)
}));
vi.mock('../../checkout/getPublicCredential.js', () => ({
  getPublicCredential: (...args) => getCredMock(...args)
}));

let domReadyCb;
let cardNumberEl;
let cardExpiryEl;
let cardCvcEl;
let elementsCreate;
let numberContainer;
let expiryContainer;
let cvcContainer;

beforeEach(() => {
  vi.resetModules();
  styleSpy = vi.fn();
  domReadyCb = null;
  getCredMock = vi.fn(async () => ({ publishable_key: 'pk_test' }));

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
  numberContainer = { querySelector: vi.fn(() => null) };
  expiryContainer = { querySelector: vi.fn(() => null) };
  cvcContainer = { querySelector: vi.fn(() => null) };

  global.document = {
    querySelector: vi.fn(sel => {
      const map = {
        '[data-smoothr-pay]': block,
        '[data-smoothr-card-number]': numberContainer,
        '[data-smoothr-card-expiry]': expiryContainer,
        '[data-smoothr-card-cvc]': cvcContainer,
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
      storeId: 'store-1',
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

    expect(getCredMock).toHaveBeenCalledWith('store-1', 'stripe', 'stripe');

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

  it('mounts when basicStripeStyle flag is set', async () => {
    window.SMOOTHR_CONFIG.basicStripeStyle = true;
    vi.useFakeTimers();
    const { mountCardFields } = await import('../../checkout/gateways/stripe.js');
    await mountCardFields();
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    expect(elementsCreate).toHaveBeenCalledWith('cardNumber', { placeholder: 'Card Number' });
    expect(elementsCreate).toHaveBeenCalledWith('cardExpiry', { placeholder: 'MM/YY' });
    expect(elementsCreate).toHaveBeenCalledWith('cardCvc', { placeholder: 'CVC' });
    expect(styleSpy).not.toHaveBeenCalled();
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

  it('removes aria-hidden when shim inputs appear', async () => {
    const shimNum = { removeAttribute: vi.fn(), setAttribute: vi.fn() };
    const shimExp = { removeAttribute: vi.fn(), setAttribute: vi.fn() };
    const shimCvc = { removeAttribute: vi.fn(), setAttribute: vi.fn() };
    let ready = false;
    numberContainer.querySelector.mockImplementation(sel => {
      if (sel === 'input.__PrivateStripeElement-input') return ready ? shimNum : null;
      return null;
    });
    expiryContainer.querySelector.mockImplementation(sel => {
      if (sel === 'input.__PrivateStripeElement-input') return ready ? shimExp : null;
      return null;
    });
    cvcContainer.querySelector.mockImplementation(sel => {
      if (sel === 'input.__PrivateStripeElement-input') return ready ? shimCvc : null;
      return null;
    });

    vi.useFakeTimers();
    const { mountCardFields } = await import('../../checkout/gateways/stripe.js');
    const p = mountCardFields();
    vi.advanceTimersByTime(50); // first poll
    ready = true;
    await vi.runAllTimersAsync();
    await p;
    vi.useRealTimers();

    expect(shimNum.removeAttribute).toHaveBeenCalledWith('aria-hidden');
    expect(shimExp.removeAttribute).toHaveBeenCalledWith('aria-hidden');
    expect(shimCvc.removeAttribute).toHaveBeenCalledWith('aria-hidden');
    expect(shimNum.setAttribute).toHaveBeenCalledWith('inert', '');
    expect(shimExp.setAttribute).toHaveBeenCalledWith('inert', '');
    expect(shimCvc.setAttribute).toHaveBeenCalledWith('inert', '');
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
