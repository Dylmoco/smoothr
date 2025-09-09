import { describe, it, expect, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildSupabaseMock, useWindowSupabaseMock } from '../utils/supabase-mock';

function flush() { return new Promise(r => setTimeout(r, 0)); }

describe('session-sync uses broker base', () => {
  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.Smoothr;
  });

  it('posts to broker from data-config-url origin', async () => {
    vi.resetModules();
    const dom = new JSDOM(`<!doctype html><html><body>
      <script id="smoothr-sdk" src="https://sdk.smoothr.io/smoothr-sdk.js" data-config-url="https://smoothr.vercel.app/api/config" data-store-id="store_test"></script>
      <div data-smoothr="auth-form">
        <input data-smoothr="email" value="a@b.com" />
        <input data-smoothr="password" value="Password1" />
        <button data-smoothr="sign-in">Sign In</button>
      </div>
    </body></html>`, { url: 'https://example.com' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.CustomEvent = dom.window.CustomEvent;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };

    const { client, mocks } = buildSupabaseMock();
    mocks.signInMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mocks.getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    useWindowSupabaseMock(client, mocks);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, url: 'https://smoothr.vercel.app/api/config', json: async () => ({ storeId: 'store_test', supabaseUrl: 'https://supabase.fake', supabaseAnonKey: 'anon' }) })
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = window.fetch = fetchMock;

    await import('../../smoothr-sdk.js');
    await window.Smoothr.ready;
    await flush();
    await flush();

    document.querySelector('[data-smoothr="sign-in"]').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    await flush();
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://smoothr.vercel.app/api/auth/session-sync',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer tok' })
      })
    );
  });
});
