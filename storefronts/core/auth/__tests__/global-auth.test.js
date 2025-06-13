import { describe, it, expect, vi, beforeEach } from 'vitest';

let getUserMock;
let signOutMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  getUserMock = vi.fn();
  signOutMock = vi.fn(() => Promise.resolve({ error: null }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signOut: signOutMock }
  }));
  return { createClient: createClientMock };
});

import { initAuth } from '../index.js';

function flushPromises() {
  return new Promise(setImmediate);
}

describe('global auth', () => {
  let logoutHandler;

  beforeEach(() => {
    logoutHandler = undefined;
    global.window = {};
    global.document = {
      addEventListener: vi.fn((evt, cb) => cb()),
      querySelectorAll: vi.fn(selector => {
        if (selector === '[data-smoothr="logout"]') {
          const btn = {
            addEventListener: vi.fn((event, cb) => {
              if (event === 'click') logoutHandler = cb;
            })
          };
          return [btn];
        }
        return [];
      })
    };
  });

  it('sets and clears window.smoothr.auth.user', async () => {
    const user = { id: '1', email: 'test@example.com' };
    getUserMock.mockResolvedValueOnce({ data: { user } });

    initAuth();
    await flushPromises();
    expect(global.window.smoothr.auth.user).toEqual(user);

    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    await logoutHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.smoothr.auth.user).toBeNull();
  });
});
