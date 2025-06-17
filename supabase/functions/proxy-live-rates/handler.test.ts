import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleRequest } from './handler';

describe('handleRequest', () => {
  beforeEach(() => {
    (globalThis as any).Deno = { env: { get: () => 'token' } };
  });

  afterEach(() => {
    delete (globalThis as any).Deno;
  });

  it('returns normalized rates with default base', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1.2, EUR: 1.1, GBP: 1 } }),
    });
    const res = await handleRequest(new Request('https://example.com'), fetchFn);
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('app_id=token'));
    const body = await res.json();
    expect(body.base).toBe('GBP');
    expect(body.rates.GBP).toBe(1);
  });

  it('uses provided base currency', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1.2, EUR: 1.1, GBP: 1 } }),
    });
    const res = await handleRequest(new Request('https://example.com/?base=USD'), fetchFn);
    const body = await res.json();
    expect(body.base).toBe('USD');
    expect(body.rates.USD).toBe(1);
  });

  it('returns 400 for invalid base', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1.2, EUR: 1.1, GBP: 1 } }),
    });
    const res = await handleRequest(new Request('https://example.com/?base=CAD'), fetchFn);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      code: 400,
      message: 'Invalid base currency: CAD',
    });
  });

  it('returns 500 when fetch fails', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server error',
    });
    const res = await handleRequest(new Request('https://example.com'), fetchFn);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      code: 500,
      message: 'Fetch failed',
      detail: 'Status 500: server error',
    });
  });
});

describe('token missing', () => {
  it('returns 500 when token is absent', async () => {
    (globalThis as any).Deno = { env: { get: () => undefined } };
    const fetchFn = vi.fn();
    const res = await handleRequest(new Request('https://example.com'), fetchFn);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      code: 500,
      message: 'OPENEXCHANGERATES_TOKEN is not set',
    });
    delete (globalThis as any).Deno;
  });
});
