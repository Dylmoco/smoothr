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
    const popup = { location: '', close: vi.fn(), closed: false };
    const win = {
      location: { origin: 'https://store.example', replace: vi.fn() },
      document: { getElementById: vi.fn(() => ({ dataset: { storeId: 'store_test' } })) },
      SMOOTHR_CONFIG: { store_id: 'store_test', oauth_popup_enabled: true },
      open: vi.fn(() => popup),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      screenX: 0,
      screenY: 0,
      outerWidth: 1024,
      outerHeight: 768,
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
    await Promise.resolve();
    const handler = window.addEventListener.mock.calls.find(c => c[0] === 'message')?.[1];
    expect(typeof handler).toBe('function');
    await handler({ origin: 'https://smoothr.vercel.app', data: { type: 'smoothr:oauth', ok: true, access_token: 'tok', store_id: 'store_test' } });
    await promise;
    expect(window.open).toHaveBeenCalled();
    expect(window.open.mock.calls[0][2]).toContain('left=272');
    expect(window.open.mock.calls[0][2]).toContain('top=64');
    expect(window.__popup.location).toBe('https://supabase.co/auth/authorize');
    expect(fetch).toHaveBeenCalledWith('https://smoothr.vercel.app/api/auth/session-sync', expect.any(Object));
    expect(window.__popup.close).toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
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

  it('falls back when popup manually closed', async () => {
    vi.useFakeTimers();
    const promise = signInWithGooglePopup();
    window.__popup.closed = true;
    await vi.advanceTimersByTimeAsync(400);
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
    expect(window.__popup.close).toHaveBeenCalled();
    vi.useRealTimers();
    await promise;
  });

  it('redirects when framed', async () => {
    window.top = {};
    window.self = {};
    await signInWithGoogle();
    expect(window.open).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
  });
});
