import { describe, it, expect, vi, beforeEach } from 'vitest';

let messageListener;
let client;

describe('oauth message listener', () => {
  beforeEach(async () => {
    vi.resetModules();
    messageListener = undefined;
    client = { auth: { setSession: vi.fn() } };
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://auth.smoothr.io');

    const doc = {
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      createElement: vi.fn(() => ({ setAttribute: vi.fn(), style: {} })),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      head: { querySelector: vi.fn(), appendChild: vi.fn() },
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    };
    const location = { origin: 'https://store.example', host: 'store.example', href: '', replace: vi.fn() };
    global.window = {
      location,
      document: doc,
      addEventListener: vi.fn((t, fn) => { if (t === 'message') messageListener = fn; }),
      removeEventListener: vi.fn(),
      __popup: { close: vi.fn() }
    };
    global.document = doc;

    const responses = [
      { status: 202, body: {} },
      { status: 200, body: { session: { access_token: 'a', refresh_token: 'r' } } }
    ];
    global.fetch = vi.fn(async (url, opts) => {
      if (String(url).includes('/oauth-proxy/exchange')) {
        const next = responses.shift();
        return { ok: next.status === 200, status: next.status, json: async () => next.body };
      }
      return { ok: true, json: async () => ({}) };
    });

    const mod = await import('../../features/auth/init.js');
    mod.setSupabaseClient(client);
    await mod.init();
    await mod.init();
  });

  it('binds once and retries exchange', async () => {
    const msg = { origin: 'https://sdk.smoothr.io', data: { type: 'SUPABASE_AUTH_COMPLETE', otc: 'one', state: 'abc' } };
    vi.useFakeTimers();
    const p = messageListener(msg);
    await vi.advanceTimersByTimeAsync(200);
    await p;
    vi.useRealTimers();

    const addCalls = global.window.addEventListener.mock.calls.filter(c => c[0] === 'message');
    expect(addCalls).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(client.auth.setSession).toHaveBeenCalledWith({ access_token: 'a', refresh_token: 'r' });
  });
});
