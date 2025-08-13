import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let orderPayload: any;

vi.mock('../../../shared/checkout/providers/authorizeNet.ts', () => {
  return { default: vi.fn(async () => ({ success: true, data: { transactionResponse: { transId: 't123' } } })) };
});

vi.mock('../../../shared/lib/findOrCreateCustomer.ts', () => ({
  findOrCreateCustomer: vi.fn().mockResolvedValue('test_customer_id'),
}));


vi.mock('../../../shared/supabase/client', () => {
  let storeFromCall = 0;
  let ordersCall = 0;
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
          return {};
        }
        if (table === 'store_settings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { settings: { active_payment_gateway: 'authorizeNet' } }, error: null }))
              }))
            }))
          };
        }
        if (table === 'orders') {
          ordersCall++;
          if (ordersCall === 1) {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({ data: { id: 'order-1', raw_data: {} }, error: null }))
                  }))
                }))
              }))
            };
          }
          if (ordersCall === 2) {
            return {
              update: vi.fn((payload: any) => {
                orderPayload = payload;
                const chain: any = {};
                chain.eq = vi.fn(() => chain);
                chain.select = vi.fn(() => ({
                  single: vi.fn(async () => ({ data: { id: 'order-1' }, error: null }))
                }));
                return chain;
              })
            };
          }
        }
        if (table === 'order_items' || table === 'discount_usages') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: null }))
            }))
          }))
        };
      }
  };
  return {
    supabase: client,
    createSupabaseClient: () => client,
    testMarker: '✅ supabase client loaded'
  };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/handleCheckout.ts');
  handleCheckout = mod.handleCheckout;
}

beforeEach(async () => {
  vi.resetModules();
  orderPayload = {};
  await loadModule();
});

describe('handleCheckout authorizeNet', () => {
  it('stores transaction id on successful response', async () => {
    const req: Partial<NextApiRequest> = {
      headers: { origin: 'https://shop.example.com' },
      method: 'POST',
      body: {
        payment_method: { dataDescriptor: 'desc', dataValue: 'val' },
        email: 'user@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        shipping: { name: 'Jane Doe', address: { line1: '1 St', city: 'Town', state: 'TS', postal_code: '00000', country: 'US' } },
        cart: [{ product_id: 'p1', quantity: 1, price: 100 }],
        total: 100,
        currency: 'USD',
        store_id: 'store-1',
        order_number: 'ST-0001',
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
    expect(orderPayload).toBeDefined();
  });
});
