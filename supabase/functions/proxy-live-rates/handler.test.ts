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

describe('handleRequest missing token', () => {
  afterEach(() => {
    delete (globalThis as any).Deno;
  });

  it('returns 500 when token is absent', async () => {
    (globalThis as any).Deno = { env: { get: () => undefined } };
    const fetchFn = vi.fn();
    const req = new Request('https://example.com/');
    req.headers.set('Authorization', AUTH_HEADER);
    const res = await handleRequest(req, fetchFn);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      code: 500,
      message: 'Live rate fetch failed'
    });
  });
});

describe('handleRequest OpenExchangeRates integration', () => {
  beforeEach(() => {
    (globalThis as any).Deno = { env: { get: () => 'token' } };
  });

  afterEach(() => {
    delete (globalThis as any).Deno;
  });

  it('appends app_id and converts to GBP base', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1, EUR: 1.1, GBP: 0.8 } })
    });

    const req = new Request('https://example.com/?symbols=USD,EUR');
    req.headers.set('Authorization', AUTH_HEADER);
    const res = await handleRequest(req, fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('app_id=token'),
      expect.any(Object)
    );

    const body = await res.json();
    expect(body.base).toBe('GBP');
    expect(body.rates.USD).toBeCloseTo(1 / 0.8);
    expect(body.rates.EUR).toBeCloseTo(1.1 / 0.8);
    expect(body.rates.GBP).toBe(1);
  });

  it('returns 500 when fetch fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network'));
    const req = new Request('https://example.com/');
    req.headers.set('Authorization', AUTH_HEADER);
    const res = await handleRequest(req, fetchFn);
    expect(fetchFn).toHaveBeenCalled();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      code: 500,
      message: 'Live rate fetch failed'
    });
  });
});
