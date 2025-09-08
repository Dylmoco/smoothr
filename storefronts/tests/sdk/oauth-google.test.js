import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithGoogle;

const PROVIDER_URL = 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=abc&redirect_uri=https%3A%2F%2Fsdk.smoothr.io%2Foauth%2Fcallback&scope=openid%20email%20profile&access_type=offline&prompt=consent&state=xyz';

describe('signInWithGoogle', () => {
  beforeEach(async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    vi.resetModules();
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://auth.smoothr.io');
    global.fetch = vi.fn(async (url) => {
      if (url.startsWith('https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/authorize')) {
        return { ok: true, json: async () => ({ url: PROVIDER_URL }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    const location = { origin: 'https://store.example', host: 'store.example', replace: vi.fn() };
    Object.defineProperty(location, 'href', {
      set(url) { this.replace(url); },
      get() { return 'https://store.example'; }
    });
    global.window = {
      location,
      document: {
        getElementById: vi.fn(() => ({ dataset: { storeId: 'store_test' } })),
        head: { querySelector: vi.fn(), appendChild: vi.fn() }
      },
      SMOOTHR_CONFIG: { store_id: 'store_test' },
      open: vi.fn().mockReturnValue(null),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      top: {},
      self: {}
    };
    ({ signInWithGoogle } = await import('../../features/auth/init.js'));
  });

  it('navigates to provider url when popup blocked', async () => {
    await signInWithGoogle();
    expect(global.window.location.replace).toHaveBeenCalledWith(PROVIDER_URL);
  });
});

