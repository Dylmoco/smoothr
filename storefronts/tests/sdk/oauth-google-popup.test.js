import { test, describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('storefronts/features/checkout/init.js', () => ({
  init: vi.fn(),
}));

let signInWithGoogle;
let signInWithGooglePopup;
let realWindow;
let realDocument;

test('setup ran with debug mode', () => {
  expect(window.Smoothr?.config?.debug).toBe(true);
});

const startUrl = 'https://smoothr.vercel.app/api/auth/oauth-start?provider=google&store_id=store_test&orig=https%3A%2F%2Fstore.example&mode=url';
const redirectUrl = 'https://smoothr.vercel.app/api/auth/oauth-start?provider=google&store_id=store_test&orig=https%3A%2F%2Fstore.example';

describe('signInWithGoogle popup', () => {
  beforeEach(async () => {
    vi.resetModules();
    realWindow = global.window;
    realDocument = global.document;
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://smoothr.vercel.app');
    const popup = { location: { href: '' }, close: vi.fn(), closed: false };
    const supabase = { auth: { setSession: vi.fn().mockResolvedValue({}) } };
    const win = {
      location: { origin: 'https://store.example', replace: vi.fn() },
      document: {
        getElementById: vi.fn(() => ({ dataset: { storeId: 'store_test' } })),
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn(() => []),
      },
      SMOOTHR_CONFIG: { store_id: 'store_test', oauth_popup_enabled: true },
      open: vi.fn(() => popup),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      screenX: 0,
      screenY: 0,
      outerWidth: 1024,
      outerHeight: 768,
      Smoothr: { __supabase: supabase },
      navigator: { userAgent: 'desktop' }
    };
    win.top = win;
    win.self = win;
    global.window = win;
    global.document = win.document;
    global.Smoothr = win.Smoothr;
    global.fetch = vi.fn(async (url) => {
      if (url === startUrl) {
        return { json: async () => ({ authorizeUrl: 'https://supabase.co/auth/authorize' }) };
      }
      if (url === 'https://smoothr.vercel.app/api/auth/session-sync') {
        return { json: async () => ({}), ok: true };
      }
      return { json: async () => ({}) };
    });
    const mod = await import('../../features/auth/init.js');
    signInWithGoogle = mod.signInWithGoogle;
    signInWithGooglePopup = mod.signInWithGooglePopup;
    window.__popup = popup;
  });

  afterEach(() => {
    global.window = realWindow;
    global.document = realDocument;
    // ensure no leak for other suites
    // @ts-ignore
    delete global.fetch;
    // @ts-ignore
    delete global.Smoothr;
  });

  it('opens popup and syncs session on message', async () => {
    const promise = signInWithGooglePopup();
    await Promise.resolve();
    await Promise.resolve();
    const handler = window.addEventListener.mock.calls.find(c => c[0] === 'message')?.[1];
    expect(typeof handler).toBe('function');
    await handler({ origin: 'https://smoothr.vercel.app', data: { type: 'smoothr_oauth_success', access_token: 'tok', refresh_token: 'ref', store_id: 'store_test' } });
    await promise;
    expect(window.__popup.location.href).toBe('https://supabase.co/auth/authorize');
    expect(window.open).toHaveBeenCalled();
    const specs = window.open.mock.calls[0][2];
    expect(specs).toContain('width=480');
    expect(specs).toContain('height=640');
    expect(specs).toContain('left=272');
    expect(specs).toContain('top=64');
    const syncCall = fetch.mock.calls.find(c => c[0] === 'https://smoothr.vercel.app/api/auth/session-sync');
    expect(syncCall).toBeTruthy();
    expect(window.__popup.close).toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
    expect(window.Smoothr.__supabase.auth.setSession).toHaveBeenCalledWith({ access_token: 'tok', refresh_token: 'ref' });
  });

  it('falls back to redirect when popup blocked', async () => {
    window.open.mockReturnValueOnce(null);
    await signInWithGoogle();
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
  });

  it('falls back to redirect on timeout', async () => {
    vi.useFakeTimers();
    const promise = signInWithGooglePopup();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(60000);
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
    expect(window.__popup.close).toHaveBeenCalled();
    const syncCall = fetch.mock.calls.find(c => c[0] === 'https://smoothr.vercel.app/api/auth/session-sync');
    expect(syncCall).toBeUndefined();
    vi.useRealTimers();
    await promise;
  });

  it('falls back when popup manually closed', async () => {
    vi.useFakeTimers();
    const promise = signInWithGooglePopup();
    window.__popup.closed = true;
    await vi.advanceTimersByTimeAsync(250);
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
    expect(window.__popup.close).toHaveBeenCalled();
    const syncCall = fetch.mock.calls.find(c => c[0] === 'https://smoothr.vercel.app/api/auth/session-sync');
    expect(syncCall).toBeUndefined();
    vi.useRealTimers();
    await promise;
  });

  it('falls back when authorize URL fetch stalls', async () => {
    vi.useFakeTimers();
    fetch.mockImplementationOnce((url, opts) => {
      if (url === startUrl) {
        return new Promise((resolve, reject) => {
          opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
        });
      }
      return { json: async () => ({}) };
    });
    const promise = signInWithGooglePopup();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(4000);
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
    expect(window.__popup.close).toHaveBeenCalled();
    const syncCall = fetch.mock.calls.find(c => c[0] === 'https://smoothr.vercel.app/api/auth/session-sync');
    expect(syncCall).toBeUndefined();
    vi.useRealTimers();
    await promise;
  });

  it('ignores messages from unexpected origins', async () => {
    vi.useFakeTimers();
    const promise = signInWithGooglePopup();
    await Promise.resolve();
    const handler = window.addEventListener.mock.calls.find(c => c[0] === 'message')?.[1];
    await handler({ origin: 'https://evil.example', data: { type: 'smoothr_oauth_success', access_token: 'bad', refresh_token: 'bad', store_id: 'store_test' } });
    expect(window.location.replace).not.toHaveBeenCalled();
    expect(window.Smoothr.__supabase.auth.setSession).not.toHaveBeenCalled();
    window.__popup.closed = true;
    await vi.advanceTimersByTimeAsync(250);
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
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

  it('redirects on iOS Safari', async () => {
    window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
    await signInWithGoogle();
    expect(window.open).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
  });
});
