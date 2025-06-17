import { describe, it, expect, vi, beforeEach } from 'vitest';

let signUpMock;
let getUserMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  signUpMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signUp: signUpMock, signOut: vi.fn(), signInWithOAuth: vi.fn() }
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

  beforeEach(() => {
    emailValue = 'test@example.com';
    passwordValue = 'secret123';
    submitHandler = undefined;
    const form = {
      addEventListener: vi.fn((ev, cb) => {
        if (ev === 'submit') submitHandler = cb;
      }),
      querySelector: vi.fn(selector => {
        if (selector === '[data-smoothr-input="email"]') return { value: emailValue };
        if (selector === '[data-smoothr-input="password"]') return { value: passwordValue };
        return null;
      })
    };

    global.window = { location: { href: '' } };
    global.document = {
      addEventListener: vi.fn((evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }),
      querySelectorAll: vi.fn(sel => sel === 'form[data-smoothr="signup"]' ? [form] : []),
      dispatchEvent: vi.fn()
    };
  });

  it('signs up and redirects on success', async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    auth.initAuth();
    await flushPromises();
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).toHaveBeenCalledWith({ email: 'test@example.com', password: 'secret123' });
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
    passwordValue = 'short';
    emailValue = 'user@example.com';
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
