import { vi, expect, test, beforeEach, afterEach, describe } from 'vitest';

// Helper to flush pending promises
const flush = () => new Promise(setImmediate);

describe('auth feature bootstrap', () => {
  let __test_bootstrap;
  const authInitMock = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    authInitMock.mockClear();
    vi.doMock('storefronts/features/auth/init.js', () => ({
      default: authInitMock,
      init: authInitMock,
    }));
    ({ __test_bootstrap } = await import('storefronts/smoothr-sdk.js'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('loads auth feature when auth trigger is present', async () => {
    const authEl = document.createElement('div');
    authEl.setAttribute('data-smoothr', 'auth');

    vi.spyOn(document, 'querySelector')
      .mockReturnValueOnce(authEl)
      .mockReturnValue(null);

    await __test_bootstrap({
      storeId: 'test-store',
      supabaseUrl: 'x',
      supabaseAnonKey: 'y',
      activePaymentGateway: 'stripe',
    });

    expect(authInitMock).toHaveBeenCalled();
  });

  test('still loads auth feature when trigger is absent', async () => {
    vi.spyOn(document, 'querySelector').mockReturnValue(null);

    await __test_bootstrap({
      storeId: 'test-store',
      supabaseUrl: 'x',
      supabaseAnonKey: 'y',
      activePaymentGateway: 'stripe',
    });

    expect(authInitMock).toHaveBeenCalled();
  });
});

describe('auth DOM interactions', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('storefronts/features/auth/init.js');
    document.body.innerHTML = '';
  });

  afterEach(async () => {
    const { __test_resetAuth } = await import('storefronts/features/auth/init.js');
    __test_resetAuth();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  test('smoothr:open-auth event toggles panel visibility', async () => {
    const panel = document.createElement('div');
    panel.setAttribute('data-smoothr', 'auth-panel');
    document.body.appendChild(panel);

    const { init } = await import('storefronts/features/auth/init.js');
    await init({
      supabase: {
        from: vi.fn(),
        auth: {
          getSession: vi.fn(),
          getUser: vi.fn(),
          signOut: vi.fn(),
        },
      },
    });

    document.dispatchEvent(new CustomEvent('smoothr:open-auth'));
    expect(panel.classList.contains('is-active')).toBe(true);
  });

  test('data-smoothr="logout" triggers sign-out', async () => {
    const logoutEl = document.createElement('button');
    logoutEl.setAttribute('data-smoothr', 'logout');
    document.body.appendChild(logoutEl);

    const signOutMock = vi.fn().mockResolvedValue({});
    const supabase = {
      from: vi.fn(),
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signOut: signOutMock,
      },
    };

    const { init } = await import('storefronts/features/auth/init.js');
    await init({ supabase });

    logoutEl.click();
    await flush();

    expect(signOutMock).toHaveBeenCalled();
  });

  test('legacy auth attributes normalize and bind', async () => {
    vi.doMock('storefronts/adapters/webflow/currencyDomAdapter.js', () => ({
      initCurrencyDom: vi.fn(),
    }));

    const signup = document.createElement('button');
    signup.setAttribute('data-smoothr-signup', '');
    document.body.appendChild(signup);

    const reset = document.createElement('button');
    reset.setAttribute('data-smoothr-password-reset', '');
    document.body.appendChild(reset);

    const confirm = document.createElement('button');
    confirm.setAttribute('data-smoothr-password-reset-confirm', '');
    document.body.appendChild(confirm);

    const signupSpy = vi.spyOn(signup, 'addEventListener');
    const resetSpy = vi.spyOn(reset, 'addEventListener');
    const confirmSpy = vi.spyOn(confirm, 'addEventListener');

    const { initAdapter } = await import('storefronts/adapters/webflow.js');
    const { domReady } = initAdapter({});
    await domReady();

    expect(signup.getAttribute('data-smoothr')).toBe('signup');
    expect(reset.getAttribute('data-smoothr')).toBe('password-reset');
    expect(confirm.getAttribute('data-smoothr')).toBe('password-reset-confirm');

    const { init } = await import('storefronts/features/auth/init.js');
    await init({
      supabase: {
        from: vi.fn(),
        auth: {
          getSession: vi.fn(),
          getUser: vi.fn(),
          signOut: vi.fn(),
        },
      },
    });

    expect(signupSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(resetSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(confirmSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

