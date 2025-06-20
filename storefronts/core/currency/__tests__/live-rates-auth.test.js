import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchExchangeRates } from '../live-rates.js';

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: { USD: 1 } }) })
  );
  process.env.PROXY_LIVE_RATES_TOKEN = 'test-token';
});

afterEach(() => {
  delete process.env.PROXY_LIVE_RATES_TOKEN;
});

describe('fetchExchangeRates auth header', () => {
  it('adds Authorization header for Supabase proxy', async () => {
    await fetchExchangeRates('USD', ['USD'], 'https://abc.functions.supabase.co/proxy-live-rates');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Token test-token');
  });

  it('omits Authorization header for other urls', async () => {
    await fetchExchangeRates('USD', ['USD'], 'https://example.com/proxy-live-rates');
    const [, options] = global.fetch.mock.calls[1];
    expect(options.headers.Authorization).toBeUndefined();
  });
});
