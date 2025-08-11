import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

  it('creates client only once across calls', async () => {
    const { getClient } = await import('../../../shared/supabase/browserClient.js');
    const a = getClient();
    const b = getClient();
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });
});
