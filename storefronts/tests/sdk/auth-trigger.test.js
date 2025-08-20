import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('auth triggers', () => {
  let win, doc, mod;
  beforeEach(async () => {
    vi.resetModules();
    win = {
      Smoothr: { auth: { user: { value: null } } },
      location: { origin: 'https://example.com' }
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

  it('dispatches smoothr:open-auth to auth-panel on account-access click', async () => {
    const btn = { getAttribute: () => 'account-access' };
    const evt = { target: { closest: () => btn }, preventDefault: vi.fn() };
    // simulate listener side: first return auth-panel
    const panel = { classList: { toggle: vi.fn() } };
    doc.querySelector = vi.fn((sel) => (sel === '[data-smoothr="auth-panel"]' ? panel : null));
    await mod.init(); // ensure handlers bound
    // call the click doc handler
    await mod.docClickHandler(evt);
    expect(doc.dispatchEvent).toHaveBeenCalled();
  });

  it('listener falls back to auth-wrapper when panel is missing', async () => {
    const evt = new (global.window.CustomEvent || Event)('smoothr:open-auth', {
      detail: { targetSelector: '[data-smoothr="auth-panel"]' }
    });
    const wrapper = {
      classList: { toggle: vi.fn() },
      querySelector: vi.fn(() => null)
    };
    // no panel in document, but wrapper exists
    doc.querySelector = vi.fn((sel) =>
      sel === '[data-smoothr="auth-panel"]' ? null :
      sel === '[data-smoothr="auth-wrapper"]' ? wrapper : null
    );
    // simulate the bound listener
    const listener = doc.addEventListener.mock.calls.find(c => c[0] === 'smoothr:open-auth')?.[1];
    listener(evt);
    expect(wrapper.classList.toggle).toHaveBeenCalledWith('is-active', true);
  });
});
