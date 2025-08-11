import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handler;
let fromFn;
let createClientMock;
const originalUrl = process.env.SUPABASE_URL;
const originalAnon = process.env.SUPABASE_ANON_KEY;

vi.mock('@supabase/supabase-js', () => {
  createClientMock = vi.fn(() => ({ from: fromFn }));
  return { createClient: createClientMock };
});

async function loadModule() {
  const mod = await import('../../../smoothr/pages/api/get-payment-key.js');
  handler = mod.default;
}

beforeEach(async () => {
  vi.resetModules();
  fromFn = vi.fn();
  process.env.SUPABASE_URL = 'http://example.com';
  process.env.SUPABASE_ANON_KEY = 'anon';
  await loadModule();
});

afterEach(() => {
  process.env.SUPABASE_URL = originalUrl;
  process.env.SUPABASE_ANON_KEY = originalAnon;
});

describe('get-payment-key handler', () => {
  it('returns key on success', async () => {
    const token = process.env.TEST_TOKENIZATION_KEY || 'k1';
    fromFn.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { api_key: token }, error: null }))
          }))
        }))
      }))
    });

    const req = { method: 'GET', query: { storeId: 's1', provider: 'nmi' } } as Partial<NextApiRequest>;
    const res: Partial<NextApiResponse> = { status: vi.fn(() => res as any), json: vi.fn(() => res as any), setHeader: vi.fn() };

    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    const token = process.env.TEST_TOKENIZATION_KEY || 'k1';
    expect(res.json).toHaveBeenCalledWith({ tokenization_key: token });
  });

  it('returns error when query fails', async () => {
    fromFn.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: null, error: { message: 'fail' } }))
          }))
        }))
      }))
    });

    const req = { method: 'GET', query: { storeId: 's1', provider: 'nmi' } } as Partial<NextApiRequest>;
    const res: Partial<NextApiResponse> = { status: vi.fn(() => res as any), json: vi.fn(() => res as any), setHeader: vi.fn() };

    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch key', detail: 'fail' });
  });
});
