import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithOAuthMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  signInWithOAuthMock = vi.fn();
  createClientMock = vi.fn(() => ({
    auth: {
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
    global.window = {};
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
