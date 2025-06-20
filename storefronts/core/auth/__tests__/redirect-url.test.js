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

  it('resolves login redirect from stores', async () => {
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
