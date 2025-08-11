import { describe, it, expect, beforeEach, vi } from 'vitest';

let createClient;
const globalKey = '__supabaseAuthClientsmoothr-browser-client';

describe('supabase browser client singleton', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_ANON_KEY = 'anon';
    vi.doUnmock('../../../shared/supabase/browserClient.js');
    createClient = vi.fn(() => ({ auth: {} }));
    vi.mock('@supabase/supabase-js', () => ({ createClient }));
    delete globalThis[globalKey];
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it('creates client only once across imports', async () => {
    const mod1 = await import('../../../shared/supabase/browserClient.js');
    const client1 = mod1.default;
    vi.resetModules();
    vi.mock('@supabase/supabase-js', () => ({ createClient }));
    const mod2 = await import('../../../shared/supabase/browserClient.js');
    const client2 = mod2.default;
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(client1).toBe(client2);
  });
});
