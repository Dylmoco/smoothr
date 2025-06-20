import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithOAuthMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  signInWithOAuthMock = vi.fn(() => Promise.resolve());
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
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

describe('google signup button', () => {
  let clickHandler;
  let store;
  let btn;

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
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === 'DOMContentLoaded') cb();
      }),
      querySelectorAll: vi.fn(selector => {
        if (selector === '[data-smoothr="signup-google"]') {
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
      querySelector: vi.fn(() => null),
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
      options: {
        redirectTo: global.window.location.origin + '/login.html'
      }
    });
    expect(global.localStorage.getItem('smoothr_oauth')).toBe('1');
  });
});
