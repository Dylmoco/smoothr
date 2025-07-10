// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchExchangeRates } from '../../core/currency/live-rates.js';

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: { USD: 1 } }) })
  );
  let store = null;
  global.localStorage = {
    getItem: vi.fn(() => store),
    setItem: vi.fn((k, v) => { store = v; }),
    removeItem: vi.fn(() => { store = null; })
  };
  global.window = global.window || { location: { origin: '', href: '', hostname: '' } };
  global.window.SMOOTHR_CONFIG = { liveRatesToken: 'test-token' };
});

afterEach(() => {
  delete global.window.SMOOTHR_CONFIG;
});

describe('fetchExchangeRates auth header', () => {
  it('adds Authorization header for Supabase proxy', async () => {
    await fetchExchangeRates('USD', ['USD'], 'https://abc.functions.supabase.co/proxy-live-rates');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Token test-token');
  });

  it('omits Authorization header for other urls', async () => {
    await fetchExchangeRates('USD', ['USD'], 'https://example.com/proxy-live-rates');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });
});
