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
      this.detail = init?.detail;
    }
  };
});

describe('bindLogoutUI', () => {
  it('calls logout and emits event', async () => {
    const listeners = {};
    const btn = {
      addEventListener: vi.fn((evt, handler) => {
        listeners[evt] = handler;
      }),
    };
    document.querySelectorAll = vi.fn(sel =>
      sel === '[data-smoothr="logout"]' ? [btn] : []
    );

    const auth = await import('../../../supabase/auth.js');
    vi.spyOn(auth, 'logout').mockResolvedValue();
    vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue('/bye');

    auth.bindLogoutUI();
    await listeners.click({
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      currentTarget: btn,
    });

    expect(auth.logout).toHaveBeenCalled();
    expect(document.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'smoothr:logout' })
    );
    expect(window.location.replace).toHaveBeenCalledWith('/bye');
  });
});
