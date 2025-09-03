import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithGoogle;
let signInWithGooglePopup;

const startUrl = 'https://smoothr.vercel.app/api/auth/oauth-start?provider=google&store_id=store_test&orig=https%3A%2F%2Fstore.example&mode=url';
const redirectUrl = 'https://smoothr.vercel.app/api/auth/oauth-start?provider=google&store_id=store_test&orig=https%3A%2F%2Fstore.example';

describe('signInWithGoogle popup', () => {
  beforeEach(async () => {
    vi.resetModules();
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://smoothr.vercel.app');
    const popup = { location: '', close: vi.fn() };
    const win = {
      location: { origin: 'https://store.example', replace: vi.fn() },
      document: { getElementById: vi.fn(() => ({ dataset: { storeId: 'store_test' } })) },
      SMOOTHR_CONFIG: { store_id: 'store_test', oauth_popup_enabled: true },
      open: vi.fn(() => popup),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    win.top = win;
    win.self = win;
    global.window = win;
    global.fetch = vi.fn(async (url, opts) => {
      if (url === startUrl) {
        return { json: async () => ({ authorizeUrl: 'https://supabase.co/auth/authorize' }) };
      }
      if (url === 'https://smoothr.vercel.app/api/auth/session-sync') {
        return { json: async () => ({}), ok: true };
      }
      return { json: async () => ({}) };
    });
    ({ signInWithGoogle, signInWithGooglePopup } = await import('../../features/auth/init.js'));
    // expose popup for tests
    window.__popup = popup;
  });

  it('opens popup and syncs session on message', async () => {
    const promise = signInWithGooglePopup();
    const handler = window.addEventListener.mock.calls.find(c => c[0] === 'message')?.[1];
    expect(typeof handler).toBe('function');
    await handler({ origin: 'https://smoothr.vercel.app', data: { type: 'smoothr:oauth', ok: true, access_token: 'tok', store_id: 'store_test' } });
    await promise;
    expect(window.open).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('https://smoothr.vercel.app/api/auth/session-sync', expect.any(Object));
    expect(window.__popup.close).toHaveBeenCalled();
  });

  it('falls back to redirect when popup blocked', async () => {
    window.open.mockReturnValueOnce(null);
    await signInWithGoogle();
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
  });

  it('falls back to redirect on timeout', async () => {
    vi.useFakeTimers();
    let handler;
    window.addEventListener.mockImplementation((event, fn) => { if (event === 'message') handler = fn; });
    const promise = signInWithGoogle();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(60000);
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
    expect(window.__popup.close).toHaveBeenCalled();
    vi.useRealTimers();
    await promise;
  });
});
