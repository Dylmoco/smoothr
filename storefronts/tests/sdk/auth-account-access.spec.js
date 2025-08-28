import { describe, it, expect, vi } from 'vitest';

function setup({ user = null, popup = false, dropdown = false } = {}) {
  const win = {
    Smoothr: { auth: { user: { value: user } } },
    location: { href: '/start' },
    dispatchEvent: vi.fn(),
  };
  const doc = {
    readyState: 'complete',
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    querySelector: vi.fn((sel) => {
      if (popup && sel === '[data-smoothr="auth-pop-up"]') return {};
      if (dropdown && sel === '[data-smoothr="auth-drop-down"]') return {};
      return null;
    }),
    querySelectorAll: vi.fn(() => [])
  };
  global.window = win;
  global.document = doc;
  return { win, doc };
}

describe('account-access trigger', () => {
  it('popup present, logged out opens auth pop-up', async () => {
    vi.resetModules();
    const { win, doc } = setup({ popup: true });
    const mod = await import('../../features/auth/init.js');
    await mod.init();
    const evt = {
      target: { closest: () => ({}) },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    expect(evt.preventDefault).toHaveBeenCalled();
    expect(evt.stopImmediatePropagation).toHaveBeenCalled();
    expect(win.location.href).toBe('/start');
    expect(doc.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(win.dispatchEvent).toHaveBeenCalledTimes(1);
    const docEvt = doc.dispatchEvent.mock.calls[0][0];
    const winEvt = win.dispatchEvent.mock.calls[0][0];
    expect(docEvt.type).toBe('smoothr:auth:open');
    expect(winEvt.type).toBe('smoothr:auth:open');
    expect(docEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
    expect(winEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
  });

  it('dropdown present, logged out skips SDK UI', async () => {
    vi.resetModules();
    const { win, doc } = setup({ dropdown: true });
    const mod = await import('../../features/auth/init.js');
    await mod.init();
    const evt = {
      target: { closest: () => ({}) },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    expect(evt.preventDefault).toHaveBeenCalled();
    expect(evt.stopImmediatePropagation).toHaveBeenCalled();
    expect(win.location.href).toBe('/start');
    expect(doc.dispatchEvent).not.toHaveBeenCalled();
    expect(win.dispatchEvent).not.toHaveBeenCalled();
  });

  it('no UI with redirect mode navigates to login URL', async () => {
    vi.resetModules();
    const { win, doc } = setup();
    const lookupRedirectUrl = vi.fn().mockResolvedValue('/login-url');
    vi.doMock('../../../supabase/authHelpers.js', () => ({
      lookupRedirectUrl,
    }));
    const mod = await import('../../features/auth/init.js');
    await mod.init();
    const evt = {
      target: {
        closest: () => ({
          getAttribute: (name) => name === 'data-smoothr-auth-mode' ? 'redirect' : null
        })
      },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    expect(lookupRedirectUrl).toHaveBeenCalledWith('login');
    expect(win.location.href).toBe('/login-url');
    expect(doc.dispatchEvent).not.toHaveBeenCalled();
    expect(win.dispatchEvent).not.toHaveBeenCalled();
  });

  it('logged-in users redirect to preferred URL', async () => {
    vi.resetModules();
    const { win, doc } = setup();
    const lookupRedirectUrl = vi.fn().mockResolvedValue('/dashboard');
    vi.doMock('../../../supabase/authHelpers.js', () => ({
      lookupRedirectUrl,
    }));
    const mod = await import('../../features/auth/init.js');
    await mod.init();
    win.Smoothr.auth.user.value = { id: '1' };
    const evt = {
      target: { closest: () => ({}) },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    expect(lookupRedirectUrl).toHaveBeenCalled();
    expect(win.location.href).toBe('/dashboard');
    expect(doc.dispatchEvent).not.toHaveBeenCalled();
    expect(win.dispatchEvent).not.toHaveBeenCalled();
  });

  it('registers capture-phase listener for account-access triggers', async () => {
    vi.resetModules();
    const { doc } = setup();
    const mod = await import('../../features/auth/init.js');
    await mod.init();
    const clickCalls = doc.addEventListener.mock.calls.filter(c => c[0] === 'click');
    expect(clickCalls.some(c => typeof c[2] === 'object' && c[2].capture === true)).toBe(true);
    const evt = {
      target: { closest: () => ({}) },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    expect(evt.preventDefault).toHaveBeenCalled();
    expect(evt.stopImmediatePropagation).toHaveBeenCalled();
  });
});
