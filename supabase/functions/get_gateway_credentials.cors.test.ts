import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handler: (req: Request) => Promise<Response>;
let createClientMock: any;

function expectCors(res: Response) {
  expect(res.headers.get('access-control-allow-origin')).toBe('*');
  expect(res.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS');
  expect(res.headers.get('access-control-allow-headers')).toBe('authorization, apikey, content-type');
  expect(res.headers.get('vary')).toBe('Origin');
  if (res.status !== 204) {
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('cache-control')).toBe('public, max-age=60, stale-while-revalidate=600');
  }
}

beforeEach(() => {
  handler = undefined as any;
  (globalThis as any).Deno = { env: { get: () => '' } };
  createClientMock = vi.fn(() => ({
    rpc: () => ({
      maybeSingle: async () => ({ data: null, error: { message: 'nope' } }),
    }),
  }));

  vi.mock('https://deno.land/std@0.177.0/http/server.ts', () => ({
    serve: (fn: any) => {
      handler = fn;
    },
  }));
  vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
    createClient: createClientMock,
  }));
});

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete (globalThis as any).Deno;
});

describe('get_gateway_credentials CORS', () => {
  it('includes CORS headers on OPTIONS', async () => {
    await import('./get_gateway_credentials/index.ts');
    const res = await handler(new Request('http://localhost', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expectCors(res);
  });

  it('includes CORS headers on invalid method', async () => {
    await import('./get_gateway_credentials/index.ts');
    const res = await handler(new Request('http://localhost', { method: 'GET' }));
    expect(res.status).toBe(400);
    expectCors(res);
  });

  it('includes CORS headers on 403 response', async () => {
    await import('./get_gateway_credentials/index.ts');
    const res = await handler(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: 's', gateway: 'g' }),
      }),
    );
    expect(res.status).toBe(403);
    expectCors(res);
  });
});

