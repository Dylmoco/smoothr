import { describe, it, expect, beforeEach, vi } from 'vitest';

let createClient;

describe('supabase browser client singleton', () => {
  beforeEach(() => {
    vi.resetModules();
    createClient = vi.fn(() => ({ auth: {} }));
    vi.mock('@supabase/supabase-js', () => ({ createClient }));
    if (globalThis.Smoothr) {
      delete globalThis.Smoothr.__supabase;
    }
  });

    it('creates client only once across calls', async () => {
      const mod1 = await import('../../../supabase/browserClient.js');
      const client1 = await mod1.getSupabaseClient();
      vi.resetModules();
      vi.mock('@supabase/supabase-js', () => ({ createClient }));
      const mod2 = await import('../../../supabase/browserClient.js');
      const client2 = await mod2.getSupabaseClient();
      expect(createClient).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
    });
});
