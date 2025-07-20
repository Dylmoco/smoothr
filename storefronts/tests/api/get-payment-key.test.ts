import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handler;
let fromFn;
let createClientMock;
const originalEnv = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv';
  await loadModule();
});

afterEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv;
});

describe('get-payment-key handler', () => {
  it('returns key on success', async () => {
    fromFn.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { api_key: 'k1' }, error: null }))
          }))
        }))
      }))
    });

    const req = { method: 'GET', query: { storeId: 's1', provider: 'nmi' } } as Partial<NextApiRequest>;
    const res: Partial<NextApiResponse> = { status: vi.fn(() => res as any), json: vi.fn(() => res as any), setHeader: vi.fn() };

    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ tokenization_key: 'k1' });
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
