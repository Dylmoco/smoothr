import { describe, it, expect, vi } from 'vitest';

function setup({ user = null, popup = false, dropdown = false } = {}) {
  const win = {
    Smoothr: { auth: { user: { value: user } } },
    location: { href: '/start' }
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
    expect(win.location.href).toBe('/start');
    expect(doc.dispatchEvent).toHaveBeenCalledTimes(2);
    const first = doc.dispatchEvent.mock.calls[0][0];
    const second = doc.dispatchEvent.mock.calls[1][0];
    expect(first.type).toBe('smoothr:auth:open');
    expect(first.detail.selector).toBe('[data-smoothr="auth-pop-up"]');
    expect(second.type).toBe('smoothr:open-auth');
    expect(second.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
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
    expect(win.location.href).toBe('/start');
    expect(doc.dispatchEvent).not.toHaveBeenCalled();
  });

  it('no UI redirects to login URL', async () => {
    vi.resetModules();
    const { win, doc } = setup();
    const lookupRedirectUrl = vi.fn().mockResolvedValue('/login-url');
    vi.doMock('../../../supabase/authHelpers.js', () => ({
      lookupRedirectUrl,
      lookupDashboardHomeUrl: vi.fn()
    }));
    const mod = await import('../../features/auth/init.js');
    await mod.init();
    const evt = {
      target: { closest: () => ({}) },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    await mod.docClickHandler(evt);
    expect(lookupRedirectUrl).toHaveBeenCalled();
    expect(win.location.href).toBe('/login-url');
    expect(doc.dispatchEvent).not.toHaveBeenCalled();
  });

  it('logged-in users redirect to preferred URL', async () => {
    vi.resetModules();
    const { win, doc } = setup();
    const lookupDashboardHomeUrl = vi.fn().mockResolvedValue('/dashboard');
    vi.doMock('../../../supabase/authHelpers.js', () => ({
      lookupRedirectUrl: vi.fn(),
      lookupDashboardHomeUrl
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
    expect(lookupDashboardHomeUrl).toHaveBeenCalled();
    expect(win.location.href).toBe('/dashboard');
    expect(doc.dispatchEvent).not.toHaveBeenCalled();
  });
});
