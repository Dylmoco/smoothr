import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let fetchMock;
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
    auth: { user: { id: 'cus_1' } }
  };

  global.window.Smoothr = Smoothr;
  global.window.smoothr = Smoothr;
  global.window.SMOOTHR_CONFIG = {
    baseCurrency: 'GBP',
    stripeKey: 'pk_test',
    storeId: 'store-1'
  };

  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'http://example.com' })
  });
  global.fetch = fetchMock;
  global.window.fetch = fetchMock;
});

afterEach(() => {
  delete global.fetch;
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
    document.querySelector('[data-smoothr-checkout]').click();
    await Promise.resolve();
    await Promise.resolve();

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

    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.currency).toBe('GBP');
    expect(body.cart.items.length).toBe(1);
    expect(body.store_id).toBe('store-1');
    expect(body.customer_id).toBe('cus_1');
    expect(body.platform).toBe('webflow');
    expect(body.billing_details).toBeUndefined();
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
