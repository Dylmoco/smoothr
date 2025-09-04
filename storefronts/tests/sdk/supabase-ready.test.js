/// <reference types="vitest" />
/// <reference types="vitest/globals" />
// @vitest-environment jsdom
// Vitest: use browser globals for Smoothr
// (kept as explicit env to avoid runner ambiguity)
import { describe, it, expect, beforeEach } from 'vitest';
import '../utils/supabase-mock';

import {
  ensureSupabaseReady,
  __setSupabaseReadyForTests,
} from '../../smoothr-sdk.mjs';

describe('ensureSupabaseReady (ESM-safe)', () => {
  beforeEach(() => {
    __setSupabaseReadyForTests(null);
    if (globalThis.window?.Smoothr) {
      delete globalThis.window.Smoothr.__supabase;
      globalThis.window.Smoothr.ready = Promise.resolve({
        supabaseUrl: 'https://supabase.test',
        supabaseAnonKey: 'anon',
        storeId: 'test',
      });
    }
  });

  it('initializes only once (createClient called once)', async () => {
    const mod = await import('@supabase/supabase-js');
    // make sure our mock is visible
    mod.createClient.mockClear();

    const p1 = ensureSupabaseReady();
    const p2 = ensureSupabaseReady();
    await p1; await p2;

    expect(mod.createClient).toHaveBeenCalledTimes(1);
  });

  it('allows test override to a resolved client', async () => {
    const fake = { hello: 'world' };
    __setSupabaseReadyForTests(fake);
    const client = await ensureSupabaseReady();
    expect(client).toBe(fake);
  });

  it('wraps raw value via Promise.resolve', async () => {
    __setSupabaseReadyForTests({ x: 1 });
    await expect(ensureSupabaseReady()).resolves.toEqual({ x: 1 });
  });
});
