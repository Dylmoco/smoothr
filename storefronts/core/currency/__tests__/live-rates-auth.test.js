// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchExchangeRates } from '../live-rates.js';

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: { USD: 1 } }) })
  );
});

describe('fetchExchangeRates auth header', () => {
  it('adds Authorization header for Supabase proxy', async () => {
    await fetchExchangeRates('USD', ['USD'], 'https://abc.functions.supabase.co/proxy-live-rates');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Token eca2385f63504d80a624d130cce7e240');
  });

  it('omits Authorization header for other urls', async () => {
    await fetchExchangeRates('USD', ['USD'], 'https://example.com/proxy-live-rates');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });
});
