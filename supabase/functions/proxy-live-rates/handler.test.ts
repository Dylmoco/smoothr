import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let handleRequest: (req: Request, fetchFn?: typeof fetch) => Promise<Response>;

describe.skip('handleRequest', () => {
  beforeEach(async () => {
    (globalThis as any).Deno = { env: { get: () => 'token' } };
    ({ handleRequest } = await import('./handler.js'));
  });

  afterEach(() => {
    vi.resetModules();
    delete (globalThis as any).Deno;
  });

  it('returns CORS headers for preflight', async () => {
    const res = await handleRequest(new Request('https://example.com', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, User-Agent');
  });

  it('returns normalized rates with default base', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timestamp: 0, rates: { USD: 1.2, EUR: 1.1, GBP: 1 } }),
    });
    global.fetch = fetchFn as any;
    const res = await handleRequest(new Request('https://example.com'));
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('app_id=token'));
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, User-Agent');
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
    global.fetch = fetchFn as any;
    const res = await handleRequest(new Request('https://example.com/?base=USD'));
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
    global.fetch = fetchFn as any;
    const res = await handleRequest(new Request('https://example.com/?base=CAD'));
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
    global.fetch = fetchFn as any;
    const res = await handleRequest(new Request('https://example.com'));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      code: 500,
      message: 'Fetch failed',
      detail: 'Status 500: server error',
    });
  });
});

describe.skip('token missing', () => {
  it('returns 500 when token is absent', async () => {
    (globalThis as any).Deno = { env: { get: () => undefined } };
    const fetchFn = vi.fn();
    ({ handleRequest } = await import('./handler.js'));
    global.fetch = fetchFn as any;
    const res = await handleRequest(new Request('https://example.com'));
    expect(fetchFn).not.toHaveBeenCalled();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      code: 500,
      message: 'OPENEXCHANGERATES_TOKEN is not set',
    });
    delete (globalThis as any).Deno;
  });
});
