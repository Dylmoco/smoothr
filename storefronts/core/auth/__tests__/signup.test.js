// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from 'vitest';

var signUpMock;
var getUserMock;
var createClientMock;

vi.mock('@supabase/supabase-js', () => {
  signUpMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signUp: signUpMock, signOut: vi.fn(), signInWithOAuth: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    }))
  }));
  return { createClient: createClientMock };
});

import * as auth from '../index.js';

vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/redirect');

function flushPromises() {
  return new Promise(setImmediate);
}

describe('signup flow', () => {
  let submitHandler;
  let emailValue;
  let passwordValue;
  let confirmValue;

  beforeEach(() => {
    emailValue = 'test@example.com';
    passwordValue = 'Password1';
    confirmValue = 'Password1';
    submitHandler = undefined;
    const form = {
      dataset: { smoothr: 'signup' },
      tagName: 'FORM',
      getAttribute: attr => (attr === 'data-smoothr' ? 'signup' : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === 'submit') submitHandler = cb;
      }),
      querySelector: vi.fn(selector => {
        if (selector === '[data-smoothr-input="email"]') return { value: emailValue };
        if (selector === '[data-smoothr-input="password"]') return { value: passwordValue };
        if (selector === '[data-smoothr-input="password-confirm"]') return { value: confirmValue };
        return null;
      })
    };

    global.window = { location: { href: '' } };
    global.document = {
      addEventListener: vi.fn((evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }),
      querySelectorAll: vi.fn(sel => (sel.includes('[data-smoothr="signup"]') ? [form] : [])),
      dispatchEvent: vi.fn()
    };
  });

  it('signs up and redirects on success', async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    auth.initAuth();
    await flushPromises();
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).toHaveBeenCalledWith({ email: 'test@example.com', password: 'Password1' });
    expect(global.document.dispatchEvent).toHaveBeenCalled();
    expect(global.window.location.href).toBe('/redirect');
  });

  it('does nothing on signup failure', async () => {
    signUpMock.mockResolvedValue({ data: null, error: new Error('bad') });
    auth.initAuth();
    await flushPromises();
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.document.dispatchEvent).not.toHaveBeenCalled();
    expect(global.window.location.href).toBe('');
  });

  it('validates email and password', async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    auth.initAuth();
    await flushPromises();
    emailValue = 'bademail';
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).not.toHaveBeenCalled();
    signUpMock.mockClear();
    passwordValue = 'short';
    emailValue = 'user@example.com';
    confirmValue = 'short';
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).not.toHaveBeenCalled();
    signUpMock.mockClear();
    passwordValue = 'Password1';
    confirmValue = 'Mismatch';
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('sets window.smoothr.auth.user on success', async () => {
    const user = { id: '1' };
    signUpMock.mockResolvedValue({ data: { user }, error: null });
    auth.initAuth();
    await flushPromises();
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.smoothr.auth.user).toEqual(user);
  });
});
