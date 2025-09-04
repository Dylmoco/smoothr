import { describe, it, expect, vi } from 'vitest';
import { __setSupabaseReadyForTests } from '../../smoothr-sdk.mjs';

describe('auth.init uses injected supabase client', () => {
  it('invokes signInWithPassword from injected client', async () => {
    const { supabase, mocks } = globalThis.__smoothrTest || {};
    __setSupabaseReadyForTests(supabase);
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));

    const auth = await import('../../features/auth/index.js');
    await auth.init({ storeId: '1' });

    document.body.innerHTML = `
      <div data-smoothr="auth-form">
        <input data-smoothr="email" value="user@example.com" />
        <input data-smoothr="password" value="Passw0rd!" />
        <div data-smoothr="login"></div>
      </div>
    `;
    const loginEl = document.querySelector('[data-smoothr="login"]');
    await auth.clickHandler({ preventDefault: () => {}, target: loginEl });

    expect(mocks.signInMock).toHaveBeenCalledTimes(1);
  });
});

