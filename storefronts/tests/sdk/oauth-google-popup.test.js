import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let signInWithGoogle;
let realWindow;

const authorizeUrl =
  'https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/authorize?store_id=store_test&redirect_to=https%3A%2F%2Fstore.example%2Fauth%2Fcallback';

describe('signInWithGoogle popup', () => {
  beforeEach(async () => {
    vi.resetModules();
    realWindow = global.window;
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://smoothr.vercel.app');
    const popup = { location: { href: '' }, close: vi.fn(), closed: false };
    const doc = {
      getElementById: vi.fn(() => ({ dataset: { storeId: 'store_test' } })),
      head: { querySelector: vi.fn(), appendChild: vi.fn() },
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      createElement: vi.fn(() => ({ setAttribute: vi.fn(), style: {} })),
      querySelector: vi.fn(() => null),
    };
    const location = { origin: 'https://store.example', host: 'store.example', replace: vi.fn() };
    Object.defineProperty(location, 'href', {
      set(url) { this.replace(url); },
      get() { return ''; },
    });
    const win = {
      location,
      document: doc,
      SMOOTHR_CONFIG: { store_id: 'store_test' },
      open: vi.fn(() => popup),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      screenLeft: 0,
      screenTop: 0,
      innerWidth: 1024,
      innerHeight: 768,
    };
    win.top = win;
    win.self = win;
    global.window = win;
    global.fetch = vi.fn(async (url) => {
      if (url === authorizeUrl) {
        return { ok: true, json: async () => ({ url: 'https://accounts.google.com/o/oauth2/auth' }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    const mod = await import('../../features/auth/init.js');
    signInWithGoogle = mod.signInWithGoogle;
    window.__popup = popup;
  });

  afterEach(() => {
    global.window = realWindow;
    // @ts-ignore
    delete global.fetch;
  });

  it('opens popup and loads authorize url', async () => {
    await signInWithGoogle();
    expect(window.open).toHaveBeenCalled();
    const specs = window.open.mock.calls[0][2];
    expect(specs).toContain('left=212');
    expect(specs).toContain('top=34');
    expect(window.__popup.location.href).toBe('https://accounts.google.com/o/oauth2/auth');
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('falls back to redirect when popup blocked', async () => {
    window.open.mockReturnValueOnce(null);
    await signInWithGoogle();
    expect(window.location.replace).toHaveBeenCalledWith(authorizeUrl);
  });

  it('falls back when popup manually closed', async () => {
    vi.useFakeTimers();
    const promise = signInWithGoogle();
    window.__popup.closed = true;
    await vi.advanceTimersByTimeAsync(5000);
    expect(window.location.replace).toHaveBeenCalledWith(authorizeUrl);
    expect(window.__popup.close).toHaveBeenCalled();
    vi.useRealTimers();
    await promise;
  });

  it('falls back when authorize URL fetch fails', async () => {
    vi.useFakeTimers();
    fetch.mockImplementationOnce(() => Promise.reject(new Error('fail')));
    const promise = signInWithGoogle();
    await vi.advanceTimersByTimeAsync(0);
    expect(window.location.replace).toHaveBeenCalledWith(authorizeUrl);
    expect(window.__popup.close).toHaveBeenCalled();
    vi.useRealTimers();
    await promise;
  });

  it('redirects when framed', async () => {
    window.top = {};
    window.self = {};
    await signInWithGoogle();
    expect(window.open).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith(authorizeUrl);
  });
});
