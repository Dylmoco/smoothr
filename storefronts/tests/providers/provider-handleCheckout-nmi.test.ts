import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let orderPayload: any;
let nmiMock: any;
let ordersCall = 0;
let storeFromCall = 0;

vi.mock('../../../shared/checkout/providers/nmi.ts', () => {
  nmiMock = vi.fn(async () => ({
    success: true,
    transaction_id: 't123',
    data: new URLSearchParams('response=1&transactionid=t123')
  }));
  return { default: nmiMock };
});

vi.mock('../../../smoothr/lib/findOrCreateCustomer.ts', () => {
  return { findOrCreateCustomer: vi.fn(async () => 'cust-1') };
});

vi.mock('../../../shared/supabase/serverClient.ts', () => {
  const client = {
    from: (table: string) => {
        if (table === 'stores') {
          storeFromCall++;
          if (storeFromCall === 1) {
            return {
              select: vi.fn(() => ({
                or: vi.fn(async () => ({ data: [{ id: 'store-1' }], error: null }))
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
        }
        if (table === 'public_store_settings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { active_payment_gateway: 'nmi' }, error: null }))
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
                    eq: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        order: vi.fn(() => ({
                          limit: vi.fn(async () => ({ data: [], error: null }))
                        }))
                      }))
                    }))
                  }))
                }))
              }))
            };
          }
          if (ordersCall === 2) {
            return {
              upsert: vi.fn((payload: any) => {
                orderPayload = payload;
                return {
                  select: vi.fn(() => ({ single: vi.fn(async () => ({ data: { id: 'order-1' }, error: null })) }))
                };
              })
            };
          }
        }
        if (table === 'order_items' || table === 'discount_usages') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      }
  };
  return { default: client, createServerSupabaseClient: () => client };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/handleCheckout.ts');
  handleCheckout = mod.handleCheckout;
}

beforeEach(async () => {
  vi.resetModules();
  orderPayload = undefined;
  ordersCall = 0;
  await loadModule();
});

describe('handleCheckout nmi', () => {
  it('stores transaction id and marks paid', async () => {
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
    expect(nmiMock).toHaveBeenCalledWith(
      expect.objectContaining({ payment_token: 'tok_123', amount: 100 })
    );
    expect(orderPayload.payment_intent_id).toBe('t123');
    expect(orderPayload.status).toBe('paid');
    expect(typeof orderPayload.paid_at).toBe('string');
  });
});
