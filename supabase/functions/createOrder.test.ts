import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let createOrder: any;
let insertMock: any;
let fromMock: any;
let counters: Record<string, number>;

async function loadModule() {
  ({ createOrder } = await import('../../shared/checkout/createOrder.ts'));
}

describe('createOrder', () => {
  beforeEach(async () => {
    counters = {};
    (globalThis as any).generateOrderNumber = vi.fn(async (storeId: string) => {
      counters[storeId] = (counters[storeId] || 0) + 1;
      return `ORD-${String(counters[storeId]).padStart(4, '0')}`;
    });

    insertMock = vi.fn((row: any) => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: row, error: null })),
      })),
    }));

    fromMock = vi.fn(() => ({ insert: insertMock }));

    vi.mock('../../shared/supabase/serverClient.ts', () => ({
      default: { from: fromMock },
      createServerSupabaseClient: () => ({ from: fromMock }),
    }));

    await loadModule();
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete (globalThis as any).generateOrderNumber;
  });

  it('generates sequential order numbers per store', async () => {
    await createOrder({
      email: 'a',
      name: 'A',
      cart: [],
      total_price: 10,
      currency: 'USD',
      gateway: 'stripe',
      store_id: 'store-1',
    });

    await createOrder({
      email: 'b',
      name: 'B',
      cart: [],
      total_price: 20,
      currency: 'USD',
      gateway: 'stripe',
      store_id: 'store-1',
    });

    await createOrder({
      email: 'c',
      name: 'C',
      cart: [],
      total_price: 30,
      currency: 'USD',
      gateway: 'stripe',
      store_id: 'store-2',
    });

    expect(insertMock).toHaveBeenCalledTimes(3);
    expect(insertMock.mock.calls[0][0].order_number).toBe('ORD-0001');
    expect(insertMock.mock.calls[1][0].order_number).toBe('ORD-0002');
    expect(insertMock.mock.calls[2][0].order_number).toBe('ORD-0001');
  });
});
