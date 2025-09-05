import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let signInWithGoogle;
let realWindow;
let messageListener;
let popup;
let client;

const authorizeUrl =
  'https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/authorize?store_id=store_test&redirect_to=https%3A%2F%2Fstore.example%2Fauth%2Fcallback';

describe('signInWithGoogle popup', () => {
  beforeEach(async () => {
    vi.resetModules();
    realWindow = global.window;
    messageListener = undefined;
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://smoothr.vercel.app');
    popup = { location: { href: '' }, closed: false, close: vi.fn(() => { popup.closed = true; }) };
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
      addEventListener: vi.fn((type, fn) => { if (type === 'message') messageListener = fn; }),
      removeEventListener: vi.fn(),
      screenLeft: 0,
      screenTop: 0,
      innerWidth: 1024,
      innerHeight: 768,
    };
    win.top = win;
    win.self = win;
    global.window = win;
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
    const mod = await import('../../features/auth/init.js');
    client = { auth: { setSession: vi.fn() } };
    mod.setSupabaseClient(client);
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

  it('handles manual popup closure without redirect', async () => {
    vi.useFakeTimers();
    window.alert = vi.fn();
    const promise = signInWithGoogle();
    window.__popup.closed = true;
    await vi.advanceTimersByTimeAsync(5000);
    expect(window.location.replace).not.toHaveBeenCalled();
    expect(window.__popup.close).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Login cancelled.');
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

  it('ignores messages from non-broker origins', async () => {
    vi.useFakeTimers();
    const promise = signInWithGoogle();
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    fetch.mockClear();
    await messageListener?.({ origin: 'https://evil.example', data: { type: 'smoothr:auth', code: 'abc' } });
    expect(fetch).not.toHaveBeenCalled();
    expect(client.auth.setSession).not.toHaveBeenCalled();
    expect(popup.close).not.toHaveBeenCalled();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('accepts messages from supabase and closes popup after setSession', async () => {
    vi.useFakeTimers();
    const promise = signInWithGoogle();
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    fetch.mockClear();
    await messageListener?.({
      origin: 'https://lpuqrzvokroazwlricgn.supabase.co',
      data: { type: 'smoothr:auth', code: 'one' }
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/exchange?code=one'
    );
    expect(client.auth.setSession).toHaveBeenCalledWith({ access_token: 'a', refresh_token: 'r' });
    expect(popup.close).toHaveBeenCalled();
    expect(popup.close.mock.invocationCallOrder[0]).toBeGreaterThan(
      client.auth.setSession.mock.invocationCallOrder[0]
    );
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('redirects when framed', async () => {
    window.top = {};
    window.self = {};
    await signInWithGoogle();
    expect(window.open).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith(authorizeUrl);
  });
});
