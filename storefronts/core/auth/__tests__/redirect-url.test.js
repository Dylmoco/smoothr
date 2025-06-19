import { describe, it, expect, vi, beforeEach } from 'vitest';

let getUserMock;
let createClientMock;
let fromSingleMock;

vi.mock('@supabase/supabase-js', () => {
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  fromSingleMock = vi.fn();
  const fromMock = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: fromSingleMock
      }))
    }))
  }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signOut: vi.fn(), signInWithOAuth: vi.fn() },
    from: fromMock
  }));
  return { createClient: createClientMock };
});

function flushPromises() {
  return new Promise(setImmediate);
}

describe('redirect url configuration', () => {
  beforeEach(() => {
    global.window = { location: { hostname: 'example.com', origin: 'https://example.com' } };
    global.document = {
      addEventListener: vi.fn((e, cb) => cb()),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => null),
      dispatchEvent: vi.fn()
    };
  });

  it('warns when oauth redirect url points to smoothr.io', async () => {
    global.__NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__ = 'https://smoothr.io/callback';
    vi.resetModules();
    const { initAuth } = await import('../index.js');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    initAuth();
    await flushPromises();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('resolves login redirect from stores', async () => {
    global.__NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__ = 'https://example.com/callback';
    vi.resetModules();
    const { initAuth, lookupRedirectUrl } = await import('../index.js');
    fromSingleMock.mockResolvedValue({ data: { login_redirect_url: '/home' }, error: null });
    initAuth();
    await flushPromises();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const url = await lookupRedirectUrl('login');
    expect(url).toBe('/home');
    expect(log).toHaveBeenCalledWith('Smoothr Auth: login redirect resolved', '/home');
    log.mockRestore();
  });

  it('falls back to root when redirect not found', async () => {
    global.__NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__ = 'https://example.com/callback';
    vi.resetModules();
    const { initAuth, lookupRedirectUrl } = await import('../index.js');
    fromSingleMock.mockResolvedValue({ data: null, error: new Error('bad') });
    initAuth();
    await flushPromises();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const url = await lookupRedirectUrl('login');
    expect(url).toBe('/');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
