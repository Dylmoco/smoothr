import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInMock;
let getUserMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  signInMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signInWithPassword: signInMock, signOut: vi.fn() }
  }));
  return { createClient: createClientMock };
});

import * as auth from '../index.js';
vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/redirect');

function flushPromises() {
  return new Promise(setImmediate);
}

describe('login form', () => {
  let clickHandler;
  let submitHandler;
  let emailValue;
  let passwordValue;

  beforeEach(() => {
    clickHandler = undefined;
    submitHandler = undefined;
    emailValue = 'user@example.com';
    passwordValue = 'Password1';

    const form = {
      addEventListener: vi.fn((ev, cb) => {
        if (ev === 'submit') submitHandler = cb;
      }),
      querySelector: vi.fn(sel => {
        if (sel === '[data-smoothr-input="email"]') return { value: emailValue };
        if (sel === '[data-smoothr-input="password"]') return { value: passwordValue };
        if (sel === '[data-smoothr="login"]') return btn;
        return null;
      })
    };

    const btn = {
      closest: vi.fn(() => form),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === 'click') clickHandler = cb;
      }),
      textContent: 'Login'
    };

    global.window = { location: { href: '' } };
    global.document = {
      addEventListener: vi.fn((evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }),
      querySelectorAll: vi.fn(sel => {
        if (sel === '[data-smoothr="login"]') return [btn];
        if (sel === 'form[data-smoothr="login-form"]') return [form];
        return [];
      }),
      dispatchEvent: vi.fn()
    };
  });

  it('validates email before login', async () => {
    signInMock.mockResolvedValue({ data: {}, error: null });
    auth.initAuth();
    await flushPromises();

    emailValue = 'bad';
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signInMock).not.toHaveBeenCalled();

    emailValue = 'user@example.com';
    await submitHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signInMock).toHaveBeenCalled();
  });
});
