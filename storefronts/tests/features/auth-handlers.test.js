import { describe, it, expect, vi } from 'vitest';

// Verify document-level auth handlers handle nested controls

describe('auth document handlers', () => {
  it('submits login from nested control', async () => {
    const mod = await import('../../features/auth/init.js');
    const { init } = mod;
    const supabase = (globalThis.__smoothrTest || {}).supabase;

    document.body.innerHTML = `
      <form data-smoothr="auth-form">
        <div>
          <input data-smoothr="email" value="user@example.com" />
          <input data-smoothr="password" value="strongpass1" />
          <button type="button" data-smoothr="login">Login</button>
        </div>
      </form>
    `;

    await init({ storeId: '1', supabase });

    const pwd = document.querySelector('[data-smoothr="password"]');
    pwd.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    const mocks = (globalThis.__smoothrTest || {}).mocks;
    expect(mocks.signInMock).toHaveBeenCalled();
  });

});

