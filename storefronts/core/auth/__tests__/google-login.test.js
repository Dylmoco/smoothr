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

import { initAuth } from '../index.js';

function flushPromises() {
  return new Promise(setImmediate);
}

describe('google login button', () => {
  let clickHandler;
  let store;

  beforeEach(() => {
    clickHandler = undefined;
    store = null;
    global.window = {};
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
        if (selector === '[data-smoothr="login-google"]') {
          const btn = {
            addEventListener: vi.fn((ev, cb) => {
              if (ev === 'click') clickHandler = cb;
            })
          };
          return [btn];
        }
        return [];
      })
    };
  });

  it('triggers Supabase OAuth sign-in', async () => {
    initAuth();
    await flushPromises();

    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: '' }
    });
    expect(global.localStorage.getItem('smoothr_oauth')).toBe('1');
  });
});
