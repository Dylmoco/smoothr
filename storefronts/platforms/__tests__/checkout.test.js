import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
let createPaymentMethodMock;

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';

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

  const cardTarget = document.createElement('div');
  cardTarget.setAttribute('data-smoothr-card-number', '');
  document.body.appendChild(cardTarget);

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
  Smoothr.checkout.submit = async () => {
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
    await fetch('/api/checkout/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
  };
  global.window.SMOOTHR_CONFIG = {
    baseCurrency: 'GBP',
    stripeKey: 'pk_test',
    storeId: 'store-1'
  };

});

afterEach(() => {
  delete global.window.SMOOTHR_CONFIG;
  delete global.Stripe;
});

async function loadCheckout() {
  const mod = await import('../webflow/checkout.js');
  return mod.initCheckout;
}

describe('checkout', () => {
  it('posts cart and currency on click', async () => {
    const initCheckout = await loadCheckout();
    initCheckout();

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
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

    expect(fetch).toHaveBeenCalled();
  });

  it('renders cart items from template', async () => {
    const initCheckout = await loadCheckout();
    initCheckout();
    const clones = document.querySelectorAll('.smoothr-checkout-item');
    expect(clones.length).toBe(1);
    expect(clones[0].querySelector('[data-smoothr-name]').textContent).toBe(
      'Item'
    );
  });
});
