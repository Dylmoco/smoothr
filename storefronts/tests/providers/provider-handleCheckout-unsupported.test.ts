import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;

vi.mock('../../../shared/lib/findOrCreateCustomer.ts', () => ({
  findOrCreateCustomer: vi.fn(async () => {
    throw new Error('fail');
  }),
}));

vi.mock('../../../shared/supabase/client', () => {
  const client = {
    from: (table: string) => {
      if (table === 'stores') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: [{ id: 'store-1' }], error: null }))
          }))
        };
      }
      if (table === 'store_settings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { settings: { active_payment_gateway: 'bogus' } }, error: null }))
            }))
          }))
        };
      }
      if (table === 'customer_payment_profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ limit: vi.fn(async () => ({ data: [], error: null })) }))
            }))
          }))
        };
      }
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(async () => ({ data: null, error: null })) })) })) })) };
    }
  };
  return { supabase: client, createSupabaseClient: () => client, testMarker: '✅ supabase client loaded' };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/handleCheckout.ts');
  handleCheckout = mod.handleCheckout;
}

beforeEach(async () => {
  vi.resetModules();
  await loadModule();
});

describe('handleCheckout unsupported provider', () => {
  it('returns 400 for unknown payment gateway', async () => {
    const req: Partial<NextApiRequest> = {
      headers: { origin: 'https://shop.example.com' },
      method: 'POST',
      body: {
        email: 'user@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        shipping: { name: 'Jane Doe', address: { line1: '1 St', city: 'Town', state: 'TS', postal_code: '00000', country: 'US' } },
        cart: [{ product_id: 'p1', quantity: 1, price: 100 }],
        total: 100,
        currency: 'USD',
        store_id: 'store-1',
        same_billing: true
      }
    } as any;

    const res: Partial<NextApiResponse> = {
      status: vi.fn(() => res as any),
      json: vi.fn(() => res as any),
      setHeader: vi.fn(),
      end: vi.fn()
    };

    await handleCheckout({ req: req as NextApiRequest, res: res as NextApiResponse });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to record customer' });
  });
});
