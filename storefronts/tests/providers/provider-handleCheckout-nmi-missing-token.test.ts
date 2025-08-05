import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let nmiMock: any;

vi.mock('../../../shared/checkout/providers/nmi.ts', () => {
  nmiMock = vi.fn();
  return { default: nmiMock };
});

vi.mock('../../../shared/lib/findOrCreateCustomer.ts', () => ({
  findOrCreateCustomer: vi.fn().mockResolvedValue('test_customer_id'),
}));

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
        if (table === 'store_settings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { settings: { active_payment_gateway: 'nmi' } }, error: null }))
              }))
            }))
          };
        }
        return {};
      }
  };
  return { supabase: client, createServerSupabaseClient: () => client, testMarker: '✅ serverClient loaded' };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/handleCheckout.ts');
  handleCheckout = mod.handleCheckout;
  nmiMock = (await import('../../../shared/checkout/providers/nmi.ts')).default;
}

beforeEach(async () => {
  vi.resetModules();
  await loadModule();
});

describe('handleCheckout nmi missing token', () => {
  it('returns 400 when payment_token is missing', async () => {
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

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid billing details',
      user_message: 'Please check your billing information and try again.',
      billing_errors: [
        { field: 'bill_line1', message: 'Billing street required' },
        { field: 'bill_city', message: 'Billing city required' },
        { field: 'bill_state', message: 'Billing state required' },
        { field: 'bill_postal', message: 'Billing postal required' },
        { field: 'bill_country', message: 'Billing country required' },
      ]
    });
    expect(nmiMock).not.toHaveBeenCalled();
  });
});
