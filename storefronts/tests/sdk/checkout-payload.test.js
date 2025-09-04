import { describe, it, expect, vi, afterEach } from 'vitest';
import gatewayDispatcher from '../../features/checkout/utils/gatewayDispatcher.js';

afterEach(() => {
  // restore fetch after each test
  global.fetch && (global.fetch = undefined);
});

describe('checkout payload', () => {
  it('sends expected data to fetch', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        clone: () => ({ json: () => Promise.resolve({}) }),
        json: () => Promise.resolve({})
      })
    );
    global.fetch = fetchMock;
    globalThis.SMOOTHR_CONFIG = { apiBase: 'https://example.com' };

    const log = vi.fn();
    const warn = vi.fn();
    const err = vi.fn();

    const payload = {
      email: 'user@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      shipping: {},
      billing: {},
      cart: [],
      total: 50,
      currency: 'USD',
      store_id: '1',
      gateway: 'stripe'
    };

    await gatewayDispatcher('stripe', payload, 'token', log, warn, err);

    expect(fetchMock).toHaveBeenCalled();
    const [, opts] = fetchMock.mock.calls[0];
    const parsed = JSON.parse(opts.body);
    expect(parsed).toHaveProperty('gateway', 'stripe');
  });
});
