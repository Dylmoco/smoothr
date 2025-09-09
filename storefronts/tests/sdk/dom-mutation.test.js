import { describe, it, expect, vi } from 'vitest';
import { createClientMock } from '../utils/supabase-mock';

function flush() { return new Promise((r) => setTimeout(r, 0)); }

describe('dom mutation bindings', () => {
  it('binds dynamically added submit-reset-password trigger', async () => {
    vi.resetModules();
    createClientMock();
    const auth = await import('../../features/auth/index.js');
    await auth.init();
    const container = document.createElement('div');
    container.innerHTML = `<form data-smoothr="auth-form"><input data-smoothr="password" /><input data-smoothr="confirm-password" /><div data-smoothr="submit-reset-password"></div></form>`;
    document.body.appendChild(container);
    auth.bindAuthElements(container);
    const trigger = container.querySelector('[data-smoothr="submit-reset-password"]');
    const errSpy = vi.fn();
    document.addEventListener('smoothr:auth:error', errSpy);
    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(errSpy).toHaveBeenCalled();
  });
});
