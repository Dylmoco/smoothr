import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

let supabase: any;
let createClientMock: any;
let builder: any;

async function loadClient() {
  supabase = (await import('../../shared/supabase/client.ts')).supabase;
}

describe('v_public_store view', () => {
  beforeEach(async () => {
    builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      single: vi.fn(),
    };

    createClientMock = vi.fn(() => ({
      from: (table: string) => {
        if (table === 'v_public_store') return builder;
        throw new Error(`Unexpected table ${table}`);
      },
    }));

    vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));
    await loadClient();
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns one row per store with public fields', async () => {
    const storeId = 'store-123';
    const row = {
      store_id: storeId,
      base_currency: 'USD',
      active_payment_gateway: 'stripe',
      publishable_key: 'pk_test_123',
      safe: { theme: 'dark' },
    };
    builder.single.mockResolvedValue({ data: row, error: null });

    const { data, error } = await supabase
      .from('v_public_store')
      .select('store_id, base_currency, active_payment_gateway, publishable_key, safe')
      .eq('store_id', storeId)
      .single();

    expect(error).toBeNull();
    expect(data).toEqual(row);
    expect(builder.select).toHaveBeenCalledWith(
      'store_id, base_currency, active_payment_gateway, publishable_key, safe'
    );
    expect(builder.eq).toHaveBeenCalledWith('store_id', storeId);
    expect(builder.single).toHaveBeenCalledTimes(1);
  });
});

