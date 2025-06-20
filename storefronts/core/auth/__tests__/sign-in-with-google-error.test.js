import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithOAuthMock;
let createClientMock;
let getSessionMock;

vi.mock('@supabase/supabase-js', () => {
  signInWithOAuthMock = vi.fn();
  getSessionMock = vi.fn(() => Promise.resolve({ data: { session: { user: null } } }));
  createClientMock = vi.fn(() => ({
    auth: {
      getSession: getSessionMock,
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      signOut: vi.fn(),
      signInWithOAuth: signInWithOAuthMock
    }
  }));
  return { createClient: createClientMock };
});

import { initAuth, signInWithGoogle } from '../index.js';

function flushPromises() {
  return new Promise(setImmediate);
}

describe('signInWithGoogle errors', () => {
  beforeEach(() => {
    global.window = { location: { search: '', pathname: '', hash: '' } };
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
  });

  it('removes oauth flag on failure', async () => {
    signInWithOAuthMock.mockRejectedValue(new Error('bad'));
    initAuth();
    await flushPromises();
    await signInWithGoogle();
    await flushPromises();
    expect(global.localStorage.setItem).toHaveBeenCalledWith('smoothr_oauth', '1');
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('smoothr_oauth');
  });
});
