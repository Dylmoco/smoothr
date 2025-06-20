import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.window = { location: { replace: vi.fn() }, addEventListener: vi.fn() };
  global.document = {
    querySelectorAll: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  global.CustomEvent = class {
    constructor(type, init) {
      this.type = type;
      this.detail = init.detail;
    }
  };
});

describe('bindLoginUI', () => {
  it('redirects using lookupRedirectUrl and emits event on success', async () => {
    const listeners = {};
    const emailInput = { value: 'a@b.com' };
    const passInput = { value: 'pass' };
    const form = {
      querySelectorAll: vi.fn(sel => {
        if (sel === '[data-smoothr="login"]') return [btn];
        if (sel === '[data-smoothr="login-google"]') return [];
        return [];
      }),
      querySelector: vi.fn(sel => (sel.includes('email') ? emailInput : passInput)),
    };
    const btn = {
      addEventListener: vi.fn((evt, handler, capture) => {
        listeners[evt] = handler;
      }),
      closest: vi.fn(() => form),
    };
    document.querySelectorAll = vi.fn(sel => {
      if (sel === 'form[data-smoothr="auth-form"]') return [form];
      return [];
    });

    const auth = await import('../../../supabase/auth.js');
    vi.spyOn(auth, 'signInWithPassword').mockResolvedValue({ data: { user: {} }, error: null });
    vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/next');

    auth.bindLoginUI();
    await listeners.click({ preventDefault: vi.fn(), stopPropagation: vi.fn() });

    expect(auth.lookupRedirectUrl).toHaveBeenCalledWith('login');
    expect(document.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'smoothr:login', detail: { user: {} } })
    );
    expect(window.location.replace).toHaveBeenCalledWith('/next');
  });

  it('logs a warning when no login trigger exists', async () => {
    const form = { querySelectorAll: vi.fn(() => []), querySelector: vi.fn() };
    document.querySelectorAll = vi.fn(() => [form]);
    const auth = await import('../../../supabase/auth.js');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    auth.bindLoginUI();
    expect(warnSpy).toHaveBeenCalled();
  });
});
