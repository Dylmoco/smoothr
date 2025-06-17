import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleRequest } from './handler';

const AUTH_HEADER = 'Token eca2385f63504d80a624d130cce7e240';

describe('handleRequest query params', () => {
  beforeEach(() => {
    // Stub Deno.env
    (globalThis as any).Deno = { env: { get: () => 'token' } };
  });

  afterEach(() => {
    delete (globalThis as any).Deno;
  });

  it('uses defaults when params missing', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1.25, EUR: 1.17, GBP: 1 } })
    });
    const req = new Request('https://example.com/');
    req.headers.set('Authorization', AUTH_HEADER);
    const res = await handleRequest(req, fetchFn);
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('symbols=USD,EUR,GBP'),
      expect.any(Object)
    );
    const body = await res.json();
    expect(body.base).toBe('GBP');
    expect(body.rates).toHaveProperty('GBP', 1);
  });

  it('allows params to override defaults', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1, CAD: 1.5 } })
    });
    const req = new Request('https://example.com/?base=USD&symbols=CAD');
    req.headers.set('Authorization', AUTH_HEADER);
    const res = await handleRequest(req, fetchFn);
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('symbols=CAD,USD'),
      expect.any(Object)
    );
    const body = await res.json();
    expect(body.base).toBe('USD');
    expect(body.rates).toHaveProperty('CAD');
    expect(body.rates).toHaveProperty('USD', 1);
  });
});
