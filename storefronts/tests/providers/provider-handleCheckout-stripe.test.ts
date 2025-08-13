import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let stripeWebhook: any;
let orderInserted = false;
let updateCalls: any[] = [];

vi.mock('../../../shared/checkout/providers/stripeProvider.ts', () => ({
  default: vi.fn(async () => {
    expect(orderInserted).toBe(true);
    return { success: true, transaction_id: 'pi_123', customer_vault_id: null };
  }),
}));

vi.mock('../../../shared/lib/findOrCreateCustomer.ts', () => ({
  findOrCreateCustomer: vi.fn().mockResolvedValue('cust-1'),
}));

vi.mock('../../../shared/checkout/utils/dedupeOrders.ts', () => ({
  dedupeOrders: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../../shared/supabase/client', () => {
  const client = {
    from: (table: string) => {
      if (table === 'stores') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [{ id: 'store-1' }], error: null })),
          })),
        };
      }
      if (table === 'store_settings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { settings: { active_payment_gateway: 'stripe' } }, error: null })),
            })),
          })),
        };
      }
      if (table === 'orders') {
        return {
          insert: vi.fn((row: any) => {
            orderInserted = true;
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: 'order-1' }, error: null })),
              })),
            };
          }),
          update: vi.fn((payload: any) => {
            updateCalls.push(payload);
            return { eq: vi.fn(() => ({})) };
          }),
        };
      }
      if (table === 'order_items' || table === 'discount_usages') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    },
  };
  return { supabase: client, createSupabaseClient: () => client, testMarker: '✅ supabase client loaded' };
});

let mockEvent: any;
vi.mock('stripe', () => {
  return { default: class { webhooks = { constructEvent: vi.fn(() => mockEvent) }; constructor() {} } };
});

beforeEach(async () => {
  vi.resetModules();
  orderInserted = false;
  updateCalls = [];
  mockEvent = null;
  (globalThis as any).generateOrderNumber = vi.fn().mockResolvedValue('ORD-1');
  ({ handleCheckout } = await import('../../../shared/checkout/handleCheckout.ts'));
  ({ default: stripeWebhook } = await import('../../../smoothr/pages/api/webhooks/stripeWebhook.ts'));
});

describe('handleCheckout stripe flow', () => {
  it('creates order before payment and updates on webhook', async () => {
    const req: Partial<NextApiRequest> = {
      headers: { origin: 'https://shop.example.com' },
      method: 'POST',
      body: {
        payment_method: 'pm_1',
        email: 'user@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        shipping: { name: 'Jane Doe', address: { line1: '1 St', city: 'Town', state: 'TS', postal_code: '00000', country: 'US' } },
        cart: [{ product_id: 'p1', quantity: 1, price: 100 }],
        total: 100,
        currency: 'USD',
        store_id: 'store-1'
      }
    };
    const res: Partial<NextApiResponse> = {
      status: vi.fn(() => res as any),
      json: vi.fn(() => res as any),
      setHeader: vi.fn(),
      end: vi.fn()
    };

    await handleCheckout({ req: req as NextApiRequest, res: res as NextApiResponse });
    expect(orderInserted).toBe(true);
    expect(updateCalls[0]).toEqual({ payment_intent_id: 'pi_123' });

    mockEvent = { type: 'payment_intent.succeeded', data: { object: { id: 'pi_123', status: 'succeeded' } } };
    const wReq: any = { method: 'POST', headers: {}, [Symbol.asyncIterator]: async function* () { yield Buffer.from(''); } };
    const wRes: any = { status: vi.fn(() => wRes), json: vi.fn(), end: vi.fn() };
    await stripeWebhook(wReq, wRes);
    expect(updateCalls[1].status).toBe('paid');
  });
});
