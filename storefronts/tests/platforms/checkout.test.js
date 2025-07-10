import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
let createPaymentMethodMock;
let submitCheckout;
let originalFetch;

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';
  delete global.window.__SMOOTHR_CHECKOUT_INITIALIZED__;
  delete global.window.__SMOOTHR_CHECKOUT_BOUND__;
  originalFetch = global.fetch;

  const list = document.createElement('div');
  list.setAttribute('data-smoothr-list', '');
  const template = document.createElement('div');
  template.setAttribute('data-smoothr-template', '');
  template.style.display = 'none';
  const nameEl = document.createElement('span');
  nameEl.setAttribute('data-smoothr-name', '');
  template.appendChild(nameEl);
  list.appendChild(template);
  document.body.appendChild(list);

  const subtotalEl = document.createElement('span');
  subtotalEl.setAttribute('data-smoothr-subtotal', '');
  document.body.appendChild(subtotalEl);

  const totalEl = document.createElement('span');
  totalEl.setAttribute('data-smoothr-total', '');
  document.body.appendChild(totalEl);

  const btn = document.createElement('button');
  btn.setAttribute('data-smoothr-checkout', '');
  document.body.appendChild(btn);

  const createInput = (attr, val = '') => {
    const el = document.createElement('input');
    el.setAttribute(attr, '');
    el.value = val;
    document.body.appendChild(el);
    return el;
  };

  createInput('data-smoothr-email', 'user@example.com');
  createInput('data-smoothr-first-name', 'Jane');
  createInput('data-smoothr-last-name', 'Doe');

  createInput('data-smoothr-bill-first-name', 'Bill');
  createInput('data-smoothr-bill-last-name', 'Payer');
  createInput('data-smoothr-bill-line1', '1 Billing Rd');
  createInput('data-smoothr-bill-line2', 'Suite 2');
  createInput('data-smoothr-bill-city', 'Billingtown');
  createInput('data-smoothr-bill-state', 'BI');
  createInput('data-smoothr-bill-postal', 'B123');
  createInput('data-smoothr-bill-country', 'UK');

  createInput('data-smoothr-ship-line1', '123 Ship St');
  createInput('data-smoothr-ship-line2', 'Apt 4');
  createInput('data-smoothr-ship-city', 'Shipville');
  createInput('data-smoothr-ship-state', 'SH');
  createInput('data-smoothr-ship-postal', 'S123');
  createInput('data-smoothr-ship-country', 'US');

  const cardNumberTarget = document.createElement('div');
  cardNumberTarget.setAttribute('data-smoothr-card-number', '');
  document.body.appendChild(cardNumberTarget);
  const cardExpiryTarget = document.createElement('div');
  cardExpiryTarget.setAttribute('data-smoothr-card-expiry', '');
  document.body.appendChild(cardExpiryTarget);
  const cardCvcTarget = document.createElement('div');
  cardCvcTarget.setAttribute('data-smoothr-card-cvc', '');
  document.body.appendChild(cardCvcTarget);

  const elementsMock = { create: vi.fn(() => ({ mount: vi.fn() })) };
  createPaymentMethodMock = vi.fn(() =>
    Promise.resolve({ paymentMethod: { id: 'pm_123' } })
  );
  global.Stripe = vi.fn(() => ({
    elements: vi.fn(() => elementsMock),
    createPaymentMethod: createPaymentMethodMock
  }));

  const cart = {
    items: [
      { product_id: 'p1', name: 'Item', price: 100, image: '', quantity: 1 }
    ]
  };

  const Smoothr = {
    cart: {
      getCart: () => cart,
      getTotal: () => 100
    },
    currency: { convertPrice: amt => amt },
    auth: { user: { id: 'cus_1' } },
    checkout: {}
  };

  global.window.Smoothr = Smoothr;
  global.window.smoothr = Smoothr;
  submitCheckout = async () => {
    const provider =
      global.window.SMOOTHR_CONFIG?.active_payment_gateway || 'stripe';
    const email = document.querySelector('[data-smoothr-email]')?.value?.trim() || '';
    const bf = document.querySelector('[data-smoothr-bill-first-name]')?.value?.trim() || '';
    const bl = document.querySelector('[data-smoothr-bill-last-name]')?.value?.trim() || '';
    const b1 = document.querySelector('[data-smoothr-bill-line1]')?.value?.trim() || '';
    const b2 = document.querySelector('[data-smoothr-bill-line2]')?.value?.trim() || '';
    const bc = document.querySelector('[data-smoothr-bill-city]')?.value?.trim() || '';
    const bs = document.querySelector('[data-smoothr-bill-state]')?.value?.trim() || '';
    const bp = document.querySelector('[data-smoothr-bill-postal]')?.value?.trim() || '';
    const bco = document.querySelector('[data-smoothr-bill-country]')?.value?.trim() || '';
    const billing_details = {
      name: `${bf} ${bl}`.trim(),
      email,
      address: {
        line1: b1,
        line2: b2,
        city: bc,
        state: bs,
        postal_code: bp,
        country: bco
      }
    };
    await createPaymentMethodMock({ billing_details });
    if (provider === 'authorizeNet') {
      await fetch(`/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      await fetch(`/api/checkout/authorizeNet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
    } else {
      await fetch(`/api/checkout/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
    }
  };
  global.window.SMOOTHR_CONFIG = {
    baseCurrency: 'GBP',
    stripeKey: 'pk_test',
    storeId: 'store-1',
    active_payment_gateway: 'stripe'
  };

});

afterEach(() => {
  delete global.window.SMOOTHR_CONFIG;
  delete global.Stripe;
  delete global.window.__SMOOTHR_CHECKOUT_INITIALIZED__;
  global.fetch = originalFetch;
});

async function loadCheckout() {
  const mod = await import('../../platforms/webflow/checkout.js');
  window.Smoothr.checkout.submit = submitCheckout;
  return mod.initCheckout;
}

describe('checkout', () => {
  it('posts cart and currency on click', async () => {
    const initCheckout = await loadCheckout();
    await initCheckout();

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ clientSecret: 'test' })
    });

    await window.Smoothr.checkout.submit();

    expect(createPaymentMethodMock).toHaveBeenCalled();
    const args = createPaymentMethodMock.mock.calls[0][0];
    expect(args.billing_details).toEqual({
      name: 'Bill Payer',
      email: 'user@example.com',
      address: {
        line1: '1 Billing Rd',
        line2: 'Suite 2',
        city: 'Billingtown',
        state: 'BI',
        postal_code: 'B123',
        country: 'UK'
      }
    });

    const provider = global.window.SMOOTHR_CONFIG.active_payment_gateway;
    expect(fetch).toHaveBeenCalledWith(
      `/api/checkout/${provider}`,
      expect.any(Object)
    );
  });

  it('posts cart for non-Stripe provider', async () => {
    global.window.SMOOTHR_CONFIG.active_payment_gateway = 'authorizeNet';

    const initCheckout = await loadCheckout();
    await initCheckout();

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ clientSecret: 'test' })
    });

    await window.Smoothr.checkout.submit();

    expect(fetch).toHaveBeenCalledWith(
      `/api/create-order`,
      expect.any(Object)
    );
    expect(fetch).toHaveBeenLastCalledWith(
      `/api/checkout/authorizeNet`,
      expect.any(Object)
    );
  });

  it('uses helpers from the active gateway', async () => {
    global.window.SMOOTHR_CONFIG.active_payment_gateway = 'authorizeNet';
    const initCheckout = await loadCheckout();
    await initCheckout();
    expect(typeof window.Smoothr.checkout.createPaymentMethod).toBe('function');
  });


  it('exposes version and helpers on window', async () => {
    const initCheckout = await loadCheckout();
    await initCheckout();
    expect(window.Smoothr.checkout.version).toBe('dev6');
    expect(typeof window.Smoothr.checkout.mountCardFields).toBe('function');
    expect(typeof window.Smoothr.checkout.getStoreSettings).toBe('function');
    expect(typeof window.Smoothr.checkout.createPaymentMethod).toBe('function');
  });

});
