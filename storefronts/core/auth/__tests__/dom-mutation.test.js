import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as auth from '../index.js';

let signInMock;
let signUpMock;
let getUserMock;
let createClientMock;

vi.mock('@supabase/supabase-js', () => {
  signInMock = vi.fn();
  signUpMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: vi.fn(),
      signInWithPassword: signInMock,
      signInWithOAuth: vi.fn(),
      signUp: signUpMock
    }
  }));
  return { createClient: createClientMock };
});

vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/redirect');

function flushPromises() {
  return new Promise(setImmediate);
}

const ATTR_SELECTOR =
  '[data-smoothr="login"], [data-smoothr="signup"], [data-smoothr="login-google"], [data-smoothr="password-reset"]';

describe('dynamic DOM bindings', () => {
  let mutationCallback;
  let elements;
  let doc;
  let win;

  beforeEach(() => {
    elements = [];
    mutationCallback = undefined;
    global.MutationObserver = class {
      constructor(cb) {
        mutationCallback = cb;
      }
      observe() {}
      disconnect() {}
    };
    doc = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === 'DOMContentLoaded') cb();
      }),
      querySelectorAll: vi.fn(selector => {
        if (selector === ATTR_SELECTOR) return elements;
        if (selector === '[data-smoothr="logout"]') return [];
        return [];
      }),
      dispatchEvent: vi.fn()
    };
    win = { location: { href: '' } };
    global.document = doc;
    global.window = win;
  });

  it('attaches listeners to added login elements and updates auth state', async () => {
    const emailInput = { value: 'user@example.com' };
    const passwordInput = { value: 'Password1' };
    const form = {
      querySelector: vi.fn(sel => {
        if (sel === '[data-smoothr-input="email"]') return emailInput;
        if (sel === '[data-smoothr-input="password"]') return passwordInput;
        return null;
      })
    };
    let clickHandler;
    const btn = {
      tagName: 'DIV',
      dataset: {},
      closest: vi.fn(() => form),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === 'click') clickHandler = cb;
      })
    };

    auth.initAuth();
    await flushPromises();
    expect(btn.addEventListener).not.toHaveBeenCalled();

    elements.push(btn);
    mutationCallback();
    expect(btn.addEventListener).toHaveBeenCalled();

    const user = { id: '1', email: 'user@example.com' };
    signInMock.mockResolvedValue({ data: { user }, error: null });
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(global.window.smoothr.auth.user).toEqual(user);
    expect(global.document.dispatchEvent).toHaveBeenCalled();
    const evt = global.document.dispatchEvent.mock.calls.at(-1)[0];
    expect(evt.type).toBe('smoothr:login');
  });

  it('attaches listeners to added signup elements and updates auth state', async () => {
    const emailInput = { value: 'new@example.com' };
    const passwordInput = { value: 'Password1' };
    const confirmInput = { value: 'Password1' };
    const form = {
      querySelector: vi.fn(sel => {
        if (sel === '[data-smoothr-input="email"]') return emailInput;
        if (sel === '[data-smoothr-input="password"]') return passwordInput;
        if (sel === '[data-smoothr-input="password-confirm"]') return confirmInput;
        if (sel === '[type="submit"]') return {};
        return null;
      })
    };
    let clickHandler;
    const btn = {
      tagName: 'BUTTON',
      dataset: {},
      closest: vi.fn(() => form),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === 'click') clickHandler = cb;
      })
    };

    auth.initAuth();
    await flushPromises();
    elements.push(btn);
    mutationCallback();
    expect(btn.addEventListener).toHaveBeenCalled();

    const user = { id: '2', email: 'new@example.com' };
    signUpMock.mockResolvedValue({ data: { user }, error: null });
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(global.window.smoothr.auth.user).toEqual(user);
    expect(global.document.dispatchEvent).toHaveBeenCalled();
    const evt = global.document.dispatchEvent.mock.calls.at(-1)[0];
    expect(evt.type).toBe('smoothr:login');
  });
});
