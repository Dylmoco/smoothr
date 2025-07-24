import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;

vi.mock('../../../shared/supabase/serverClient', () => {
  const client = {
    from: (table: string) => {
      if (table === 'stores') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: [{ id: 'store-1' }], error: null }))
          }))
        };
      }
      return {};
    },
    rpc: vi.fn(() => Promise.resolve({ data: 'ST-0001', error: null }))
  };
  return { supabase: client, createServerSupabaseClient: () => client, testMarker: '✅ serverClient loaded' };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/handleCheckout.ts');
  handleCheckout = mod.handleCheckout;
}

beforeEach(async () => {
  vi.resetModules();
  await loadModule();
});

describe('handleCheckout store_id validation', () => {
  it('returns 400 when store_id is missing', async () => {
    const req: Partial<NextApiRequest> = {
      headers: { origin: 'https://shop.example.com' },
      method: 'POST',
      body: {
        payment_method: 'pm_123',
        email: 'user@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        shipping: { name: 'Jane Doe', address: { line1: '1 St', city: 'Town', state: 'TS', postal_code: '00000', country: 'US' } },
        cart: [{ product_id: 'p1', quantity: 1, price: 100 }],
        total: 100,
        currency: 'USD'
      }
    } as any;

    const res: Partial<NextApiResponse> = {
      status: vi.fn(() => res as any),
      json: vi.fn(() => res as any),
      setHeader: vi.fn(),
      end: vi.fn()
    };

    await handleCheckout({ req: req as NextApiRequest, res: res as NextApiResponse });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing store_id',
      field: 'store_id',
      user_message: 'Configuration error. Please refresh the page and try again.'
    });
  });
});
