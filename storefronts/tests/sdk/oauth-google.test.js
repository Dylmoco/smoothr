import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithGoogle;

const authorizeUrl =
  'https://lpuqrzvokroazwlricgn.supabase.co/authorize?store_id=store_test&redirect_to=https%3A%2F%2Fstore.example%2Fauth%2Fcallback';

describe('signInWithGoogle', () => {
  beforeEach(async () => {
    vi.resetModules();
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://smoothr.vercel.app');
    global.fetch = vi.fn();
    const location = { origin: 'https://store.example', replace: vi.fn() };
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
