import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.window = { location: { replace: vi.fn() } };
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
    const form = {
      querySelector: vi.fn(sel => ({ value: sel.includes('email') ? 'a@b.com' : 'pass' })),
    };
    const btn = {
      addEventListener: vi.fn((evt, handler) => { listeners[evt] = handler; }),
      closest: vi.fn(() => form),
    };
    document.querySelectorAll = vi.fn(sel => {
      if (sel === 'div[data-smoothr="login"], button[data-smoothr="login"]') return [btn];
      return [];
    });

    const auth = await import('../../../supabase/auth.js');
    vi.spyOn(auth, 'signInWithPassword').mockResolvedValue({ data: { user: {} }, error: null });
    vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/next');

    auth.bindLoginUI();
    await listeners.click({ preventDefault: vi.fn() });

    expect(auth.lookupRedirectUrl).toHaveBeenCalledWith('login');
    expect(document.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'smoothr:login', detail: { user: {} } })
    );
    expect(window.location.replace).toHaveBeenCalledWith('/next');
  });

  it('logs a warning when no login trigger exists', async () => {
    document.querySelectorAll = vi.fn(() => []);
    const auth = await import('../../../supabase/auth.js');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    auth.bindLoginUI();
    expect(warnSpy).toHaveBeenCalled();
  });
});
