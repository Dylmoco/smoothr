import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClientMock, currentSupabaseMocks } from '../utils/supabase-mock';

function flush() { return new Promise((r) => setTimeout(r, 0)); }

describe('reset password UX', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
    window.location.hash = '';
    window.SMOOTHR_CONFIG = { store_id: 'store_test', storeId: 'store_test', routes: { resetPassword: '/reset-password' } };
    globalThis.getCachedBrokerBase = () => 'https://broker.example';
    globalThis.ensureConfigLoaded = () => Promise.resolve();
    createClientMock();
  });

  it('opens reset panel when wrapper present', async () => {
    document.body.innerHTML = `<div data-smoothr="auth-pop-up" data-smoothr-autoclass="1"><div data-smoothr="reset-password"><form data-smoothr="auth-form"><input data-smoothr="password" /><input data-smoothr="confirm-password" /><div data-smoothr="submit-reset-password"></div></form></div></div>`;
    const auth = await import('../../features/auth/index.js');
    await auth.init();
    await flush();
    const pop = document.querySelector('[data-smoothr="auth-pop-up"]');
    expect(pop?.getAttribute('data-smoothr-active')).toBe('1');
  });

  it('shows error and emits event on password mismatch', async () => {
    document.body.innerHTML = `<div data-smoothr="reset-password"><form data-smoothr="auth-form"><input data-smoothr="password" value="Password1" /><input data-smoothr="confirm-password" value="Mismatch1" /><div data-smoothr="submit-reset-password"></div></form></div>`;
    const auth = await import('../../features/auth/index.js');
    await auth.init();
    await flush();
    const trigger = document.querySelector('[data-smoothr="submit-reset-password"]');
    const errSpy = vi.fn();
    document.addEventListener('smoothr:auth:error', errSpy);
    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    const errEl = document.querySelector('[data-smoothr="error"]');
    expect(errEl?.textContent).toMatch(/Passwords do not match/i);
    expect(errSpy).toHaveBeenCalled();
  });

});
