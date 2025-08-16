import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSupabaseClient } from '../../../supabase/client/browserClient.js';

describe('supabase browser client singleton', () => {
  beforeEach(() => {
    global.window = global.window || {};
    window.Smoothr = window.Smoothr || {};
    window.Smoothr.supabaseReady = Promise.resolve({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        setSession: vi.fn().mockResolvedValue({}),
        signInWithOAuth: vi.fn().mockResolvedValue({}),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    });
    delete window.Smoothr.__supabase;
  });

  it('resolves same client across calls', async () => {
    const client1 = await getSupabaseClient();
    const client2 = await getSupabaseClient();
    expect(client1).toBe(client2);
  });
});

