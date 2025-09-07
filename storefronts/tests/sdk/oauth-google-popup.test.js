import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let signInWithGoogle;
let realWindow;
let messageListener;
let popup;
let client;

const AUTHORIZE =
  'https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/authorize?store_id=store_test&redirect_to=https%3A%2F%2Fstore.example';
const PROVIDER_URL = 'https://accounts.google.com/o/oauth2/auth';
const EXCHANGE = 'https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/exchange';

describe('signInWithGoogle popup', () => {
  beforeEach(async () => {
    vi.resetModules();
    realWindow = global.window;
    messageListener = undefined;
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://auth.smoothr.io');
    popup = { location: { href: '' }, closed: false, close: vi.fn(() => { popup.closed = true; }) };
    const doc = {
      getElementById: vi.fn(() => ({ dataset: { storeId: 'store_test' } })),
      head: { querySelector: vi.fn(), appendChild: vi.fn() },
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      createElement: vi.fn(() => ({ setAttribute: vi.fn(), style: {} })),
      querySelector: vi.fn(() => null)
    };
    const location = { origin: 'https://store.example', host: 'store.example', replace: vi.fn() };
    Object.defineProperty(location, 'href', {
      set(url) { this.replace(url); },
      get() { return 'https://store.example'; }
    });
    const win = {
      location,
      document: doc,
      SMOOTHR_CONFIG: { store_id: 'store_test' },
      open: vi.fn(() => popup),
      addEventListener: vi.fn((t, fn) => { if (t === 'message') messageListener = fn; }),
      removeEventListener: vi.fn((t) => { if (t === 'message') messageListener = undefined; }),
      screenLeft: 0,
      screenTop: 0,
      innerWidth: 1024,
      innerHeight: 768
    };
    win.top = win;
    win.self = win;
    global.window = win;
    const usedCodes = new Set();
    global.fetch = vi.fn(async (url, opts) => {
      if (url === AUTHORIZE) {
        return { ok: true, json: async () => ({ url: PROVIDER_URL }) };
      }
      if (url === EXCHANGE && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        if (usedCodes.has(body.otc)) {
          return { ok: false, json: async () => ({}) };
        }
        usedCodes.add(body.otc);
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

  it('opens popup and loads provider url', async () => {
    console.debug('test: opens popup and loads provider url');
    await signInWithGoogle();
    expect(window.open).toHaveBeenCalled();
    expect(window.__popup.location.href).toBe(PROVIDER_URL);
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('falls back to provider url when popup blocked', async () => {
    console.debug('test: falls back when popup blocked');
    window.open.mockReturnValueOnce(null);
    await signInWithGoogle();
    expect(window.location.replace).toHaveBeenCalledWith(PROVIDER_URL);
  });

  it('handles manual popup closure without redirect', async () => {
    console.debug('test: manual popup closure');
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

  it('ignores messages from non-broker origins', async () => {
    console.debug('test: ignore non-broker messages');
    vi.useFakeTimers();
    const promise = signInWithGoogle();
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    fetch.mockClear();
    await messageListener?.({ origin: 'https://evil.example', data: { type: 'SUPABASE_AUTH_COMPLETE', otc: 'abc' } });
    expect(fetch).not.toHaveBeenCalled();
    expect(client.auth.setSession).not.toHaveBeenCalled();
    expect(popup.close).not.toHaveBeenCalled();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('processes callback messages and closes popup', async () => {
    console.debug('test: callback message flow');
    vi.useFakeTimers();
    const promise = signInWithGoogle();
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    fetch.mockClear();
    await messageListener?.({
      origin: 'https://lpuqrzvokroazwlricgn.supabase.co',
      data: { type: 'SUPABASE_AUTH_COMPLETE', otc: 'one' }
    });
    // second postMessage should be ignored after cleanup
    await messageListener?.({
      origin: 'https://lpuqrzvokroazwlricgn.supabase.co',
      data: { type: 'SUPABASE_AUTH_COMPLETE', otc: 'one' }
    });
    // simulate manual close button
    popup.close();
    expect(fetch).toHaveBeenCalledWith(EXCHANGE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ otc: 'one', store_id: 'store_test' })
    });
    expect(client.auth.setSession).toHaveBeenCalledWith({ access_token: 'a', refresh_token: 'r' });
    expect(popup.close).toHaveBeenCalled();
    expect(popup.close.mock.invocationCallOrder[0]).toBeGreaterThan(
      client.auth.setSession.mock.invocationCallOrder[0]
    );
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('alerts on authorize 403', async () => {
    console.debug('test: authorize 403');
    window.alert = vi.fn();
    fetch.mockImplementationOnce(async () => ({ ok: false, status: 403 }));
    await signInWithGoogle();
    expect(window.alert).toHaveBeenCalledWith('Failed to start login, please try again');
  });

  it('alerts on authorize 500', async () => {
    console.debug('test: authorize 500');
    window.alert = vi.fn();
    fetch.mockImplementationOnce(async () => ({ ok: false, status: 500 }));
    await signInWithGoogle();
    expect(window.alert).toHaveBeenCalledWith('Failed to start login, please try again');
  });

  it('ignores messages without SUPABASE_AUTH_COMPLETE', async () => {
    console.debug('test: missing SUPABASE_AUTH_COMPLETE');
    vi.useFakeTimers();
    const promise = signInWithGoogle();
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    fetch.mockClear();
    await messageListener?.({
      origin: 'https://lpuqrzvokroazwlricgn.supabase.co',
      data: { type: 'WRONG', otc: 'one' }
    });
    await messageListener?.({
      origin: 'https://lpuqrzvokroazwlricgn.supabase.co',
      data: { type: 'SUPABASE_AUTH_COMPLETE' }
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(client.auth.setSession).not.toHaveBeenCalled();
    expect(popup.close).not.toHaveBeenCalled();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('alerts when exchange returns missing_params', async () => {
    console.debug('test: exchange missing_params');
    vi.useFakeTimers();
    const promise = signInWithGoogle();
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    fetch.mockImplementationOnce(async () => {
      throw new Error('missing_params');
    });
    window.alert = vi.fn();
    await messageListener?.({
      origin: 'https://lpuqrzvokroazwlricgn.supabase.co',
      data: { type: 'SUPABASE_AUTH_COMPLETE', otc: 'two' }
    });
    expect(window.alert).toHaveBeenCalledWith('Login failed, please try again');
    expect(client.auth.setSession).not.toHaveBeenCalled();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('redirects when framed', async () => {
    console.debug('test: redirects when framed');
    window.top = {};
    window.self = {};
    await signInWithGoogle();
    expect(window.open).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith(PROVIDER_URL);
  });
});

