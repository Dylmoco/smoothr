import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const loadScriptOnceMock = vi.fn(() => Promise.resolve());
vi.mock('../../utils/loadScriptOnce.js', () => ({
  default: loadScriptOnceMock
}));

const supabaseMaybeSingle = vi.fn();
vi.mock('@supabase/supabase-js', () => {
  const eq = vi.fn(() => ({ eq, maybeSingle: supabaseMaybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { createClient: vi.fn(() => ({ from })) };
});
vi.mock('../../../shared/supabase/browserClient.js', () => {
  const eq = vi.fn(() => ({ eq, maybeSingle: supabaseMaybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const client = { from };
  return {
    supabase: client,
    default: client,
    ensureSupabaseSessionAuth: vi.fn()
  };
});

let getCredMock;
vi.mock('../../features/checkout/core/credentials.js', () => ({
  getGatewayCredential: (...args) => getCredMock(...args)
}));

let createPaymentMethodMock;
let submitCheckout;
let originalFetch;

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';
  delete global.window.__SMOOTHR_CHECKOUT_INITIALIZED__;
  delete global.window.__SMOOTHR_CHECKOUT_BOUND__;
  originalFetch = global.fetch;

  loadScriptOnceMock.mockReset();
  loadScriptOnceMock.mockResolvedValue();
  supabaseMaybeSingle.mockReset();
  const publishable = process.env.TEST_STRIPE_PUBLISHABLE || 'pk_test';
  supabaseMaybeSingle.mockResolvedValue({
    data: { publishable_key: publishable },
    error: null
  });
  getCredMock = vi.fn(async () => ({ publishable_key: publishable }));

  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

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
  btn.setAttribute('data-smoothr-pay', '');
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
      await fetch(`/api/createOrder`, {
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
  const storeId = process.env.TEST_STORE_ID || 'store-1';
  global.window.SMOOTHR_CONFIG = {
    baseCurrency: 'GBP',
    stripeKey: publishable,
    storeId,
    active_payment_gateway: 'stripe',
    debug: true
  };

});

afterEach(() => {
  delete global.window.SMOOTHR_CONFIG;
  delete global.Stripe;
  delete global.window.__SMOOTHR_CHECKOUT_INITIALIZED__;
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

async function loadCheckout() {
  const mod = await import('../../adapters/webflow/initCheckoutWebflow.js');
  window.Smoothr.checkout.submit = submitCheckout;
  return mod.init;
}

describe('checkout', () => {
  if (vi.setTimeout) vi.setTimeout(20000);
  it('posts cart and currency on click', async () => {
    const init = await loadCheckout();
    await init();

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

    const init = await loadCheckout();
    await init();

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ clientSecret: 'test' })
    });

    await window.Smoothr.checkout.submit();

    expect(fetch).toHaveBeenCalledWith(
      `/api/createOrder`,
      expect.any(Object)
    );
    expect(fetch).toHaveBeenLastCalledWith(
      `/api/checkout/authorizeNet`,
      expect.any(Object)
    );
  });

  it('mounts gateway when initialized', async () => {
    global.window.SMOOTHR_CONFIG.active_payment_gateway = 'authorizeNet';
    const init = await loadCheckout();
    await init();
    expect(createPaymentMethodMock).not.toHaveBeenCalled();
  });

  it('logs warning when gateway script fails to load', async () => {
    loadScriptOnceMock.mockRejectedValueOnce(new Error('load failed'));
    const init = await loadCheckout();
    await init();
    expect(console.error).toHaveBeenCalledWith(
      '[Smoothr Checkout] Failed to load Stripe SDK',
      expect.any(Error)
    );
    expect(console.warn).toHaveBeenCalledWith(
      '[Smoothr Checkout]',
      'Failed to load gateway SDK:',
      'load failed'
    );
  });

  it('logs credential fetch errors', async () => {
    getCredMock.mockRejectedValueOnce(new Error('db down'));
    const init = await loadCheckout();
    await init();
    expect(console.warn).toHaveBeenCalledWith(
      '[Smoothr Stripe]',
      'Credential fetch error:',
      'db down'
    );
  });

});
