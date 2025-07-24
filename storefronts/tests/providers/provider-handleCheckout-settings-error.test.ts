import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let providerMock: any;

vi.mock('../../../shared/checkout/providers/nmi.ts', () => {
  providerMock = vi.fn(async () => ({ success: true }));
  return { default: providerMock };
});

vi.mock('../../../smoothr/lib/findOrCreateCustomer.ts', () => {
  return { findOrCreateCustomer: vi.fn(async () => 'cust-1') };
});

vi.mock('../../../shared/supabase/serverClient', () => {
  let storeFromCall = 0;
  const client = {
    from: (table: string) => {
      if (table === 'stores') {
        storeFromCall++;
        if (storeFromCall === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: [{ id: 'store-1' }], error: null }))
            }))
          };
        }
        if (storeFromCall === 2) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { prefix: 'ST', order_sequence: 1 },
                  error: null
                }))
              }))
            }))
          };
        }
        return {};
      }
      if (table === 'store_settings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: { message: 'fail' } }))
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

describe('handleCheckout supabase error', () => {
  it('returns error when store settings query fails', async () => {
    const req: Partial<NextApiRequest> = {
      headers: { origin: 'https://shop.example.com' },
      method: 'POST',
      body: {
        payment_token: 'tok_123',
        email: 'user@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        shipping: { name: 'Jane Doe', address: { line1: '1 St', city: 'Town', state: 'TS', postal_code: '00000', country: 'US' } },
        cart: [{ product_id: 'p1', quantity: 1, price: 100 }],
        total: 100,
        currency: 'USD',
        store_id: 'store-1'
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
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to load store settings', detail: 'fail' });
    expect(providerMock).not.toHaveBeenCalled();
  });
});
