import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let handleCheckout: any;
let scenario = 'valid';

vi.mock('../../../shared/checkout/utils/dedupeOrders.ts', () => ({
  dedupeOrders: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../../shared/lib/findOrCreateCustomer.ts', () => ({
  findOrCreateCustomer: vi.fn().mockResolvedValue('cust-1'),
}));

vi.mock('../../../shared/supabase/client', () => {
  const chain = (result: any = { data: null, error: null }) => {
    const obj: any = { ...result };
    obj.eq = vi.fn(() => obj);
    obj.select = vi.fn(() => obj);
    obj.maybeSingle = vi.fn(async () => ({ data: result.data, error: null }));
    return obj;
  };
  const client = {
    from: (table: string) => {
      if (table === 'stores') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ data: [{ id: 'store-1' }], error: null })) })) };
      }
      if (table === 'discounts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => {
                  const base = {
                    id: 'disc1',
                    code: 'SAVE',
                    type: 'percent',
                    percent: 10,
                    starts_at: null,
                    ends_at: null,
                    usage_limit: scenario === 'usage' ? 1 : null,
                    min_order_value_cents: scenario === 'min' ? 200 : null,
                  } as any;
                  if (scenario === 'expired') base.ends_at = new Date(Date.now() - 1000).toISOString();
                  return { data: base, error: null };
                }),
              })),
            })),
          })),
        };
      }
      if (table === 'discount_usages') {
        return chain({ data: { count: scenario === 'usage' ? 2 : 0 } });
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) })),
        })),
      };
    },
  };
  return { supabase: client, createSupabaseClient: () => client, testMarker: '✅ supabase client loaded' };
});

beforeEach(async () => {
  vi.resetModules();
  ({ handleCheckout } = await import('../../../shared/checkout/handleCheckout.ts'));
});

function runCase(code: string, total: number) {
  const req: Partial<NextApiRequest> = {
    headers: { origin: 'https://shop.example.com' },
    method: 'POST',
    body: {
      discount_code: code,
      total,
      email: 'user@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      shipping: { name: 'Jane Doe', address: { line1: '1 St', city: 'Town', state: 'TS', postal_code: '00000', country: 'US' } },
      cart: [],
      currency: 'USD',
      store_id: 'store-1'
    }
  };
  const res: any = { setHeader: vi.fn(), end: vi.fn() };
  res.status = vi.fn(() => res);
  res.json = vi.fn((body: any) => body);
  return handleCheckout({ req: req as NextApiRequest, res: res as NextApiResponse }).then(() => res.json.mock.calls[0][0]);
}

describe('discount validation', () => {
  it('valid code returns summary', async () => {
    scenario = 'valid';
    const result = await runCase('SAVE', 100);
    expect(result).toEqual({ isValid: true, summary: { code: 'SAVE', type: 'percent', value_cents: null, percent: 10 } });
  });

  it('expired code is invalid', async () => {
    scenario = 'expired';
    const result = await runCase('SAVE', 100);
    expect(result).toEqual({ isValid: false, summary: undefined });
  });

  it('usage limit exceeded', async () => {
    scenario = 'usage';
    const result = await runCase('SAVE', 100);
    expect(result).toEqual({
      isValid: false,
      summary: { error: 'Discount usage limit exceeded' }
    });
  });

  it('min order not met', async () => {
    scenario = 'min';
    const result = await runCase('SAVE', 100);
    expect(result).toEqual({ isValid: false, summary: undefined });
  });
});
