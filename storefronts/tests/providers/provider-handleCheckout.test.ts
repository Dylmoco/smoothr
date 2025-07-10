import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let orderPayload: any;

vi.mock('../../../shared/checkout/providers/authorizeNet.ts', () => {
  return { default: vi.fn(async () => ({ success: true, data: { transactionResponse: { transId: 't123' } } })) };
});

vi.mock('../../../../apps/admin-dashboard/lib/findOrCreateCustomer.ts', () => {
  return { findOrCreateCustomer: vi.fn(async () => 'cust-1') };
});

vi.mock('../../../shared/supabase/serverClient.ts', () => {
  let storeFromCall = 0;
  let ordersCall = 0;
  return {
    default: {
      from: (table: string) => {
        if (table === 'stores') {
          storeFromCall++;
          if (storeFromCall === 1) {
            return {
              select: vi.fn(() => ({
                or: vi.fn(async () => ({ data: [{ id: 'store-1' }], error: null }))
              }))
            };
          } else if (storeFromCall === 2) {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: { prefix: 'ST', order_sequence: 1 }, error: null }))
                }))
              }))
            };
          } else {
            return {
              update: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null }))
              }))
            };
          }
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
            const builder: any = {
              select: vi.fn(() => builder),
              eq: vi.fn(() => builder),
              order: vi.fn(() => builder),
              limit: vi.fn(async () => ({ data: [], error: null }))
            };
            return builder;
          }
          if (ordersCall === 2) {
            return {
              upsert: vi.fn((payload: any) => {
                orderPayload = payload;
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({ data: { id: 'order-1' }, error: null }))
                  }))
                };
              })
            };
          }
        }
        if (table === 'order_items') {
          return { insert: vi.fn(async () => ({ error: null })) };
        }
        return {};
      }
    }
  };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/handleCheckout.ts');
  handleCheckout = mod.handleCheckout;
}

beforeEach(async () => {
  vi.resetModules();
  orderPayload = undefined;
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
    expect(orderPayload.raw_data.transaction_id).toBe('t123');
    expect(orderPayload.payment_intent_id).toBe('t123');
    expect(orderPayload.status).toBe('paid');
    expect(orderPayload.payment_status).toBe('paid');
  });
});
