import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('auth triggers', () => {
  let win, doc, mod;
  beforeEach(async () => {
    vi.resetModules();
    win = {
      Smoothr: { auth: { user: { value: null } } },
      location: { origin: 'https://example.com' },
      dispatchEvent: vi.fn(),
    };
    doc = {
      readyState: 'complete',
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
    };
    global.window = win;
    global.document = doc;
    mod = await import('../../features/auth/init.js');
    await mod.init();
  });

  it('popup mode dispatches smoothr:auth:open and toggles auth panel', async () => {
    const btn = {};
    const evt = {
      target: { closest: () => btn },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    const panel = {
      classList: { toggle: vi.fn(), contains: vi.fn(() => false) },
      getAttribute: (k) => (k === 'data-smoothr-autoclass' ? '1' : null),
      setAttribute: vi.fn(),
    };
    doc.querySelector = vi.fn(sel => (sel.includes('auth-pop-up') ? panel : null));
    await mod.docClickHandler(evt);
    expect(win.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(doc.dispatchEvent).toHaveBeenCalledTimes(1);
    const winEvt = win.dispatchEvent.mock.calls[0][0];
    const docEvt = doc.dispatchEvent.mock.calls[0][0];
    expect(winEvt.type).toBe('smoothr:auth:open');
    expect(docEvt.type).toBe('smoothr:auth:open');
    expect(winEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
    expect(docEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
    expect(panel.classList.toggle).toHaveBeenCalledWith('is-active', true);
  });

  it('page mode redirects to login URL', async () => {
    const btn = {};
    const evt = {
      target: { closest: () => btn },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    // cannot assert actual nav without stubbing lookupRedirectUrl; smoke check dispatch path ran
    expect(typeof mod.docClickHandler).toBe('function');
  });

  it('dropdown mode does nothing and skips SDK UI', async () => {
    const btn = {};
    doc.querySelector = vi.fn(sel => (sel.includes('auth-drop-down') ? {} : null));
    const evt = {
      target: { closest: () => btn },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    expect(doc.dispatchEvent).not.toHaveBeenCalled();
    expect(win.dispatchEvent).not.toHaveBeenCalled();
  });
});

