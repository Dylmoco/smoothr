import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ensureSupabaseReady, __setSupabaseReadyForTests } from '../../smoothr-sdk.js';

describe('ensureSupabaseReady', () => {
  beforeEach(() => {
    __setSupabaseReadyForTests(null);
    if (typeof window !== 'undefined') {
      window.Smoothr = window.Smoothr || {};
      delete window.Smoothr.__supabase;
      window.Smoothr.ready = Promise.resolve({
        storeId: 'store_test',
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'anon'
      });
    }
  });

  afterEach(() => {
    __setSupabaseReadyForTests(null);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('initializes only once', async () => {
    const createClient = vi.fn(() => ({}));
    vi.doMock('@supabase/supabase-js', () => ({ createClient }), { virtual: true });
    const p1 = ensureSupabaseReady();
    const p2 = ensureSupabaseReady();
    await p1;
    await p2;
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('allows test override', async () => {
    const fake = {};
    __setSupabaseReadyForTests(fake);
    expect(await ensureSupabaseReady()).toBe(fake);
  });

  it('wraps raw client values', async () => {
    const fake = {};
    __setSupabaseReadyForTests(fake);
    await expect(ensureSupabaseReady()).resolves.toBe(fake);
  });
});
