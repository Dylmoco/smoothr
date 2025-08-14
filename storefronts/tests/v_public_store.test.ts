import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

let supabase: any;
let loadPublicConfig: any;
let builder: any;

describe('loadPublicConfig', () => {
  beforeEach(async () => {
    builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle: vi.fn(),
    };

    supabase = {
      from: (table: string) => {
        if (table === 'v_public_store') return builder;
        throw new Error(`Unexpected table ${table}`);
      },
    };
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';

    vi.mock('../../shared/supabase/client.ts', () => ({
      createSupabaseClient: vi.fn(() => supabase),
      supabase,
      testMarker: '✅ supabase client loaded',
    }));

    ({ loadPublicConfig } = await import('../features/config/sdkConfig.js'));
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns one row per store with public fields', async () => {
    const storeId = 'a3fea30b-8a63-4a72-9040-6049d88545d0';
    const row = {
      store_id: storeId,
      active_payment_gateway: 'stripe',
      publishable_key: 'pk_live_123',
      base_currency: 'GBP',
      public_settings: {},
    };
    builder.maybeSingle.mockResolvedValue({ data: row, error: null });

    const config = await loadPublicConfig(storeId, supabase);

    expect(config).toEqual(row);
    expect(builder.select).toHaveBeenCalledWith(
      'store_id,active_payment_gateway,publishable_key,base_currency,public_settings'
    );
    expect(builder.eq).toHaveBeenCalledWith('store_id', storeId);
    expect(builder.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('defaults missing active_payment_gateway to null', async () => {
    const storeId = 'a3fea30b-8a63-4a72-9040-6049d88545d0';
    const row = {
      store_id: storeId,
      publishable_key: 'pk_live_123',
      base_currency: 'GBP',
      public_settings: {},
    };
    builder.maybeSingle.mockResolvedValue({ data: row, error: null });

    const config = await loadPublicConfig(storeId, supabase);

    expect(config.active_payment_gateway).toBeNull();
    expect(config.public_settings).toEqual({});
  });

  it('returns fallback settings on query error', async () => {
    const storeId = 'a3fea30b-8a63-4a72-9040-6049d88545d0';
    builder.maybeSingle.mockResolvedValue({
      data: {},
      error: { status: 500, code: 'PGRST500', message: 'failed' },
    });

    const config = await loadPublicConfig(storeId, supabase);

    expect(config).toEqual({ public_settings: {}, active_payment_gateway: null });
  });
});

