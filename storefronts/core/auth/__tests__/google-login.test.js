import { describe, it, expect, vi, beforeEach } from 'vitest';

let getUserMock;
let signInWithOAuthMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  signInWithOAuthMock = vi.fn(() => Promise.resolve());
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: vi.fn(),
      signInWithOAuth: signInWithOAuthMock
    }
  }));
  return { createClient: createClientMock };
});

import * as auth from '../index.js';
const { initAuth } = auth;
vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/redirect');

function flushPromises() {
  return new Promise(setImmediate);
}

describe('google login button', () => {
  let clickHandler;
  let store;
  let btn;
  let successEl;

  beforeEach(() => {
    clickHandler = undefined;
    store = null;
    global.window = { location: { href: '' } };
    global.localStorage = {
      getItem: vi.fn(() => store),
      setItem: vi.fn((k, v) => {
        store = v;
      }),
      removeItem: vi.fn()
    };
    successEl = {
      textContent: '',
      style: { display: 'none' },
      hidden: true,
      removeAttribute: vi.fn(attr => {
        if (attr === 'hidden') delete successEl.hidden;
      }),
      focus: vi.fn()
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === 'DOMContentLoaded') cb();
      }),
      querySelectorAll: vi.fn(selector => {
        if (selector === '[data-smoothr="login-google"]') {
          btn = {
            textContent: 'Google',
            disabled: false,
            dataset: {},
            addEventListener: vi.fn((ev, cb) => {
              if (ev === 'click') clickHandler = cb;
            })
          };
          return [btn];
        }
        return [];
      }),
      querySelector: vi.fn(sel => (sel === '[data-smoothr-success]' ? successEl : null)),
      dispatchEvent: vi.fn()
    };
  });

  it('triggers Supabase OAuth sign-in', async () => {
    initAuth();
    await flushPromises();

    const p = clickHandler({ preventDefault: () => {} });
    expect(btn.textContent).toBe('Loading...');
    expect(btn.disabled).toBe(true);
    await p;
    await flushPromises();

    expect(btn.textContent).toBe('Google');
    expect(btn.disabled).toBe(false);

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: (typeof global.__NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__ !== 'undefined' && global.__NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__) || (typeof global.window !== 'undefined' ? global.window.location.origin : '') }
    });
    expect(global.localStorage.getItem('smoothr_oauth')).toBe('1');
  });

  it('logs redirect url used for OAuth', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    initAuth();
    await flushPromises();

    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(logSpy).toHaveBeenCalledWith(
      'Smoothr Auth: using NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL',
      (typeof global.__NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__ !== 'undefined' &&
        global.__NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__) ||
        (typeof global.window !== 'undefined' ? global.window.location.origin : '')
    );
    logSpy.mockRestore();
  });

  it('logs and displays errors', async () => {
    const err = new Error('bad');
    signInWithOAuthMock.mockRejectedValue(err);
    const errorEl = {
      textContent: '',
      style: { display: 'none' },
      hidden: true,
      removeAttribute: vi.fn(attr => {
        if (attr === 'hidden') delete errorEl.hidden;
      }),
      focus: vi.fn()
    };
    global.document.querySelector.mockImplementation(sel =>
      sel === '[data-smoothr-error]' ? errorEl : sel === '[data-smoothr-success]' ? successEl : null
    );
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    initAuth();
    await flushPromises();
    const p = clickHandler({ preventDefault: () => {} });
    expect(btn.textContent).toBe('Loading...');
    expect(btn.disabled).toBe(true);
    await p;
    await flushPromises();
    expect(btn.textContent).toBe('Google');
    expect(btn.disabled).toBe(false);

    expect(errorSpy).toHaveBeenCalledWith('Google OAuth failed', err);
    expect(errorEl.textContent).toBe('bad');
    expect(errorEl.removeAttribute).toHaveBeenCalledWith('hidden');
    expect(global.localStorage.getItem('smoothr_oauth')).toBe(null);
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('smoothr_oauth');
    errorSpy.mockRestore();
  });

  it('clears oauth flag after redirect', async () => {
    signInWithOAuthMock.mockResolvedValue({});
    initAuth();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(global.localStorage.getItem('smoothr_oauth')).toBe('1');
    expect(global.localStorage.removeItem).not.toHaveBeenCalled();

    const user = { id: '1', email: 'g@example.com' };
    getUserMock.mockResolvedValue({ data: { user } });
    initAuth();
    await flushPromises();

    expect(successEl.textContent).toBe('Logged in, redirecting...');
    expect(successEl.removeAttribute).toHaveBeenCalledWith('hidden');
    expect(successEl.style.display).toBe('');
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('smoothr_oauth');
    expect(global.window.location.href).toBe('/redirect');
  });
});
