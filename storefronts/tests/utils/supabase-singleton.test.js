import { describe, it, expect, beforeEach, vi } from 'vitest';

let createClient;
const globalKey = '__supabaseAuthClientsmoothr-browser-client';

describe('supabase browser client singleton', () => {
  beforeEach(() => {
    vi.resetModules();
    createClient = vi.fn(() => ({ auth: {} }));
    vi.mock('@supabase/supabase-js', () => ({ createClient }));
    delete globalThis[globalKey];
  });

  it('creates client only once across imports', async () => {
    const mod1 = await import('../../../supabase/browserClient.js');
    const client1 = mod1.default;
    vi.resetModules();
    vi.mock('@supabase/supabase-js', () => ({ createClient }));
    const mod2 = await import('../../../supabase/browserClient.js');
    const client2 = mod2.default;
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(client1).toBe(client2);
  });
});
