import { vi } from 'vitest';

const mockSingle = vi.fn();
const mockEqGateway = vi.fn(() => ({ single: mockSingle }));
const mockEqStore = vi.fn(() => ({ eq: mockEqGateway }));
const mockSelect = vi.fn(() => ({ eq: mockEqStore }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const originalUrl = process.env.SUPABASE_URL;
const originalAnon = process.env.SUPABASE_ANON_KEY;

beforeEach(() => {
  (createClient as any).mockClear();
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockEqStore.mockClear();
  mockEqGateway.mockClear();
  mockSingle.mockClear();
  process.env.SUPABASE_URL = 'https://example.com';
  process.env.SUPABASE_ANON_KEY = 'anon';
});

afterEach(() => {
  process.env.SUPABASE_URL = originalUrl;
  process.env.SUPABASE_ANON_KEY = originalAnon;
});

describe('get-payment-key API', () => {
  it('returns browser-safe keys from v_public_store', async () => {
    mockSingle.mockResolvedValue({
      data: {
        publishable_key: 'pk_test_123',
        tokenization_key: 'tok_123',
        api_login_id: 'api_123',
      },
      error: null,
    });

    const { default: handler } = await import('../../../smoothr/pages/api/get-payment-key.js');

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status, setHeader: vi.fn() } as Partial<NextApiResponse>;
    const req = { query: { store_id: 'store1', gateway: 'stripe' } } as Partial<NextApiRequest>;

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      publishable_key: 'pk_test_123',
      tokenization_key: 'tok_123',
      api_login_id: 'api_123',
      message: 'Deprecated - use get_gateway_credentials edge function',
    });
    expect(mockFrom).toHaveBeenCalledWith('v_public_store');
    expect(mockSelect).toHaveBeenCalledWith('publishable_key, tokenization_key, api_login_id');
    expect(mockEqStore).toHaveBeenCalledWith('store_id', 'store1');
    expect(mockEqGateway).toHaveBeenCalledWith('active_payment_gateway', 'stripe');
  });

  it('returns deprecation message if no data', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const { default: handler } = await import('../../../smoothr/pages/api/get-payment-key.js');

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status, setHeader: vi.fn() } as Partial<NextApiResponse>;
    const req = { query: { store_id: 'bad', gateway: 'stripe' } } as Partial<NextApiRequest>;

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: 'Deprecated - use get_gateway_credentials edge function',
    });
  });
});
