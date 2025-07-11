import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let orderPayload: any;

vi.mock('../../../shared/checkout/providers/nmi.ts', () => {
  return { default: vi.fn(async () => ({ success: true, data: { transactionid: 't123' } })) };
});

vi.mock('../../../smoothr/lib/findOrCreateCustomer.ts', () => {
  return { findOrCreateCustomer: vi.fn(async () => 'cust-1') };
});

vi.mock('../../../shared/supabase/serverClient.ts', () => {
  return {
    default: {
      from: (table: string) => {
        if (table === 'stores') {
          return {
            select: vi.fn(() => ({
              or: vi.fn(async () => ({ data: [{ id: 'store-1' }], error: null }))
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
        if (table === 'orders') {
          return {
            upsert: vi.fn((payload: any) => {
              orderPayload = payload;
              return {
                select: vi.fn(() => ({ single: vi.fn(async () => ({ data: { id: 'order-1' }, error: null })) }))
              };
            })
          };
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
    expect(orderPayload.payment_intent_id).toBe('t123');
    expect(orderPayload.status).toBe('paid');
    expect(typeof orderPayload.paid_at).toBe('string');
  });
});
