import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.window = { location: { replace: vi.fn() } };
  global.document = {
    querySelector: vi.fn(),
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
      addEventListener: vi.fn((evt, handler) => { listeners[evt] = handler; }),
    };
    document.querySelector = vi.fn(sel => sel === '[data-smoothr-login-form]' ? form : null);

    const auth = await import('../../../supabase/auth.js');
    vi.spyOn(auth, 'signInWithPassword').mockResolvedValue({ data: { user: {} }, error: null });
    vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/next');

    auth.bindLoginUI();
    await listeners.submit({ preventDefault: vi.fn() });

    expect(auth.lookupRedirectUrl).toHaveBeenCalledWith('login');
    expect(document.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'smoothr:login', detail: { user: {} } })
    );
    expect(window.location.replace).toHaveBeenCalledWith('/next');
  });
});
