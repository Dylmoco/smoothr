import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithGoogle;

const authorizeUrl =
  'https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/authorize?store_id=store_test&redirect_to=https%3A%2F%2Fstore.example%2Fauth%2Fcallback';

describe('signInWithGoogle', () => {
  beforeEach(async () => {
    vi.resetModules();
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://smoothr.vercel.app');
    const usedCodes = new Set();
    global.fetch = vi.fn(async (url) => {
      if (url === authorizeUrl) {
        return { ok: true, json: async () => ({ url: 'https://accounts.google.com/o/oauth2/auth' }) };
      }
      const m = url.match(/oauth-proxy\/exchange\?code=(.*)$/);
      if (m) {
        const code = m[1];
        if (usedCodes.has(code)) {
          return { ok: false, json: async () => ({}) };
        }
        usedCodes.add(code);
        return { ok: true, json: async () => ({ access_token: 'a', refresh_token: 'r' }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    const location = { origin: 'https://store.example', host: 'store.example', replace: vi.fn() };
    Object.defineProperty(location, 'href', {
      set(url) {
        this.replace(url);
      },
      get() {
        return '';
      }
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
    };
    ({ signInWithGoogle } = await import('../../features/auth/init.js'));
  });

  it('navigates to auth authorize when popup blocked', async () => {
    await signInWithGoogle();
    expect(global.window.location.replace).toHaveBeenCalledWith(authorizeUrl);
  });
});
