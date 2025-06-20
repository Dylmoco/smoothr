import { describe, it, expect, vi, beforeEach } from 'vitest';

let getSessionMock;
let getUserMock;
let signOutMock;
let setSessionMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  getSessionMock = vi.fn();
  getUserMock = vi.fn();
  setSessionMock = vi.fn(() => Promise.resolve({ data: {} }));
  signOutMock = vi.fn(() => Promise.resolve({ error: null }));
  createClientMock = vi.fn(() => ({
    auth: { getSession: getSessionMock, getUser: getUserMock, signOut: signOutMock, setSession: setSessionMock }
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
    global.window = { location: { search: '', pathname: '', hash: '' } };
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
    getSessionMock.mockResolvedValueOnce({ data: { session: { user } } });

    initAuth();
    await flushPromises();
    expect(global.window.smoothr.auth.user).toEqual(user);

    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    await logoutHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.smoothr.auth.user).toBeNull();
  });

  it('restores session from url tokens', async () => {
    const user = { id: '2', email: 'token@example.com' };
    global.window.location = { search: '?smoothr_token=a&refresh_token=b', pathname: '/home', hash: '' };
    global.window.history = { replaceState: vi.fn() };
    global.window.SMOOTHR_CONFIG = { debug: true };
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    setSessionMock.mockResolvedValueOnce({ data: {} });
    getSessionMock.mockResolvedValueOnce({ data: { session: { user } } });

    initAuth();
    await flushPromises();

    expect(setSessionMock).toHaveBeenCalledWith({ access_token: 'a', refresh_token: 'b' });
    expect(global.window.history.replaceState).toHaveBeenCalledWith({}, '', '/home');
    expect(logSpy).toHaveBeenCalledWith('[Smoothr Auth] Restored session from OAuth token');
    expect(global.window.smoothr.auth.user).toEqual(user);
    logSpy.mockRestore();
  });
});
