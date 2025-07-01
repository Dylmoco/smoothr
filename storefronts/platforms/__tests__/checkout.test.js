import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let fetchMock;

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
    currency: { convertPrice: amt => amt }
  };

  global.window.Smoothr = Smoothr;
  global.window.smoothr = Smoothr;
  global.window.SMOOTHR_CONFIG = { baseCurrency: 'GBP' };

  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'http://example.com' })
  });
  global.fetch = fetchMock;
});

afterEach(() => {
  delete global.fetch;
  delete global.window.SMOOTHR_CONFIG;
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
    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.baseCurrency).toBe('GBP');
    expect(body.cart.items.length).toBe(1);
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
