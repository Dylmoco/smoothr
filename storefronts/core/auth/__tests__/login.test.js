// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from 'vitest';

var signInMock;
var getUserMock;
var createClientMock;

vi.mock('@supabase/supabase-js', () => {
  signInMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signInWithPassword: signInMock, signOut: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn().mockResolvedValue({ data: null, error: null }) }))
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
      dataset: {},
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
      dataset: { smoothr: 'login' },
      getAttribute: attr => (attr === 'data-smoothr' ? 'login' : null),
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

  it('sets window.smoothr.auth.user on success', async () => {
    const user = { id: '1', email: 'user@example.com' };
    signInMock.mockResolvedValue({ data: { user }, error: null });
    auth.initAuth();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.smoothr.auth.user).toEqual(user);
  });
});
