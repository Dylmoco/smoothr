import { describe, it, expect, beforeEach, vi } from 'vitest';

let container;
let emailInput;
let totalEl;
let gatewayEl;
let submitBtn;
let fetchMock;
let stripeMock;

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';

  container = document.createElement('div');
  container.setAttribute('data-smoothr-checkout', '');
  container.dataset.smoothrProductId = 'prod1';

  emailInput = document.createElement('input');
  emailInput.setAttribute('data-smoothr-email', '');
  emailInput.value = 'test@example.com';

  totalEl = document.createElement('span');
  totalEl.setAttribute('data-smoothr-total', '12.34');

  gatewayEl = document.createElement('div');
  gatewayEl.setAttribute('data-smoothr-gateway', '');

  submitBtn = document.createElement('button');
  submitBtn.setAttribute('data-smoothr-submit', '');

  container.append(emailInput, totalEl, gatewayEl, submitBtn);
  document.body.appendChild(container);

  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ client_secret: 'cs_test' })
  });
  global.fetch = fetchMock;

  stripeMock = {
    elements: vi.fn(() => ({
      create: vi.fn(() => ({ mount: vi.fn() })),
      submit: vi.fn()
    })),
    confirmPayment: vi.fn(() => ({}))
  };
  global.Stripe = vi.fn(() => stripeMock);

  global.window.SMOOTHR_CONFIG = { stripeKey: 'pk_test' };
});

afterEach(() => {
  delete global.fetch;
  delete global.Stripe;
  delete global.window.SMOOTHR_CONFIG;
});

async function loadCheckout() {
  const mod = await import('../webflow/checkout.js');
  return mod.initCheckout;
}

describe('checkout amount parsing', () => {
  it('converts decimal totals to cents', async () => {
    const initCheckout = await loadCheckout();
    await initCheckout();
    submitBtn.click();
    await Promise.resolve();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.amount).toBe(1234);
  });
});
