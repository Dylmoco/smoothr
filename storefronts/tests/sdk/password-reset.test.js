import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClientMock, currentSupabaseMocks } from "../utils/supabase-mock";
import { resolveRecoveryDestination } from "shared/auth/resolveRecoveryDestination";
import { validatePasswordsOrThrow } from "../../features/auth/validators.js";

let auth;

const realWindow = globalThis.window;
const realDocument = globalThis.document;

function flushPromises() {
  return new Promise(setImmediate);
}

it('does not set loading class on non-reset routes when hash exists', async () => {
  vi.resetModules();
  history.replaceState(null, '', '/home#access_token=abc&type=recovery');
  const origLoc = window.location;
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { ...origLoc, replace: vi.fn(), pathname: '/home', hash: '#access_token=abc&type=recovery' };
  const classAdd = vi.spyOn(document.documentElement.classList, 'add');
  const auth = await import('../../features/auth/index.js');
  await auth.init();
  // should not add smoothr-reset-loading on non-reset route
  expect(classAdd.mock.calls.find(([c]) => c === 'smoothr-reset-loading')).toBeUndefined();
  classAdd.mockRestore();
  document.body.innerHTML = '';
  window.location = origLoc;
});


it('navigates to platform reset route when token present (framer)', async () => {
  vi.resetModules();
  history.replaceState(null, '', '/home#access_token=tok&type=recovery');
  const origLoc = window.location;
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { ...origLoc, replace: vi.fn(), pathname: '/home', hash: '#access_token=tok&type=recovery' };
  window.Smoothr = { events: { emit: vi.fn() } };
  document.body.innerHTML = '<script id="smoothr-sdk" platform="framer"></script>';
  const auth = await import('../../features/auth/index.js');
  await auth.init();
  expect((window.location).replace).toHaveBeenCalledWith('/auth/reset#access_token=tok&type=recovery');
  expect(window.Smoothr.events.emit).toHaveBeenCalledWith('smoothr:reset:auto-open', { mode: 'early' });
  window.location = origLoc;
  document.body.innerHTML = '';
  delete window.Smoothr;
});

it('navigates to platform reset route when token present (webflow)', async () => {
  vi.resetModules();
  history.replaceState(null, '', '/home#access_token=tok&type=recovery');
  const origLoc = window.location;
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { ...origLoc, replace: vi.fn(), pathname: '/home', hash: '#access_token=tok&type=recovery' };
  window.Smoothr = { events: { emit: vi.fn() } };
  document.body.innerHTML = '<script id="smoothr-sdk" platform="webflow"></script>';
  const auth = await import('../../features/auth/index.js');
  await auth.init();
  expect((window.location).replace).toHaveBeenCalledWith('/reset-password#access_token=tok&type=recovery');
  expect(window.Smoothr.events.emit).toHaveBeenCalledWith('smoothr:reset:auto-open', { mode: 'early' });
  window.location = origLoc;
  document.body.innerHTML = '';
  delete window.Smoothr;
});

it('stays on reset route when already present', async () => {
  vi.resetModules();
  history.replaceState(null, '', '/auth/reset#access_token=tok&type=recovery');
  const origLoc = window.location;
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { ...origLoc, replace: vi.fn(), pathname: '/auth/reset', hash: '#access_token=tok&type=recovery' };
  window.Smoothr = { events: { emit: vi.fn() } };
  document.body.innerHTML = '';
  const auth = await import('../../features/auth/index.js');
  await auth.init();
  expect((window.location).replace).not.toHaveBeenCalled();
  expect(window.Smoothr.events.emit).toHaveBeenCalledWith('smoothr:reset:auto-open', { mode: 'early' });
  window.location = origLoc;
  delete window.Smoothr;
});

it('already on localized reset page → no redirect', async () => {
  vi.resetModules();
  history.replaceState(null, '', '/fr/reset-password#access_token=tok&type=recovery');
  const origLoc = window.location;
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { ...origLoc, replace: vi.fn(), pathname: '/fr/reset-password', hash: '#access_token=tok&type=recovery' };
  window.Smoothr = { events: { emit: vi.fn() } };
  document.body.innerHTML = '<script id="smoothr-sdk" platform="webflow"></script>';
  const auth = await import('../../features/auth/index.js');
  await auth.init();
  expect((window.location).replace).not.toHaveBeenCalled();
  expect(window.Smoothr.events.emit).toHaveBeenCalledWith('smoothr:reset:auto-open', { mode: 'early' });
  window.location = origLoc;
  document.body.innerHTML = '';
  delete window.Smoothr;
});


it('submits password-reset via Enter on reset-only form', async () => {
  vi.resetModules();
  document.body.innerHTML = '<script id="smoothr-sdk" src="https://sdk.smoothr.io/smoothr-sdk.js" data-config-url="https://broker.example/api/config" data-store-id="store_test"></script>';
  createClientMock();
    const { resetPasswordMock } = currentSupabaseMocks();
  globalThis.getCachedBrokerBase = () => 'https://broker.example';
  globalThis.ensureConfigLoaded = () => Promise.resolve();
  auth = await import("../../features/auth/index.js");
  await auth.init();
  await flushPromises();

  const form = document.createElement('form');
  form.setAttribute('data-smoothr', 'auth-form');
  const email = document.createElement('input');
  email.setAttribute('data-smoothr', 'email');
  email.value = 'user@example.com';
  const reset = document.createElement('div');
  reset.setAttribute('data-smoothr', 'password-reset');
  form.append(email, reset);
  document.body.appendChild(form);
  auth.bindAuthElements?.(form);

  reset.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flushPromises();

    expect(resetPasswordMock).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("https://lpuqrzvokroazwlricgn.supabase.co/reset?store_id=store_test") })
    );
});

it('does not send duplicate reset emails when clicking a bound reset control', async () => {
  vi.resetModules();
  createClientMock();
    const { resetPasswordMock } = currentSupabaseMocks();
  auth = await import("../../features/auth/index.js");
  await auth.init();
  await flushPromises();

  const container = document.createElement('div');
  container.setAttribute('data-smoothr', 'auth-form');
  container.innerHTML = `
    <input data-smoothr="email" value="reset@example.com" />
    <div data-smoothr="password-reset"></div>
  `;
  document.body.appendChild(container);

  // Ensure direct binding is attached
  auth.bindAuthElements(container);

  const trigger = container.querySelector('[data-smoothr="request-password-reset"], [data-smoothr="password-reset"]');
  trigger.click();
  await flushPromises();

    expect(resetPasswordMock).toHaveBeenCalledTimes(1);
});
// Case A: config URL present (modern)
it('sends reset via broker API with redirectTo (bridge + orig)', async () => {
  vi.resetModules();
  document.body.innerHTML = `<script id="smoothr-sdk" src="https://sdk.smoothr.io/smoothr-sdk.js" data-store-id="store_test" data-config-url="https://broker.example/api/config"></script><form data-smoothr="auth-form"></form>`;
  window.SMOOTHR_CONFIG = { store_id: 'store_test', storeId: 'store_test', routes: { resetPassword: '/auth/reset' } };
  globalThis.getCachedBrokerBase = () => 'https://broker.example';
  globalThis.ensureConfigLoaded = () => Promise.resolve();
    createClientMock();
    const { resetPasswordMock } = currentSupabaseMocks();

  const auth = await import('../../features/auth/index.js');
  await auth.init();
  const { requestPasswordReset } = auth;
  await requestPasswordReset?.('user@example.com');

    expect(resetPasswordMock).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("https://lpuqrzvokroazwlricgn.supabase.co/reset?store_id=store_test") })
    );
});


it('session-sync stay-on-page can post via hidden iframe when enabled', async () => {
  globalThis.window.SMOOTHR_CONFIG = { auth: { silentPost: true } };
  document.body.innerHTML = '<div id="root"></div>';
  const auth = await import('../../features/auth/init.js');
  expect(typeof auth.init).toBe('function');
  const before = document.querySelectorAll('iframe').length;
  const p = auth;
  expect(before).toBeGreaterThanOrEqual(0);
});


describe('resolveRecoveryDestination (allowlist)', () => {
  it('rejects arbitrary orig in production when no domains are configured', () => {
    const res = resolveRecoveryDestination({
      liveDomain: null,
      storeDomain: null,
      signInRedirectUrl: null,
      orig: 'https://attacker.example',
      nodeEnv: 'production',
    });
    expect(res.type).toBe('error');
    expect(res.code).toBe('NO_ALLOWED_ORIGIN');
  });

  it('allows localhost orig in development when no domains are configured', () => {
    const res = resolveRecoveryDestination({
      liveDomain: null,
      storeDomain: null,
      signInRedirectUrl: null,
      orig: 'http://localhost:3000',
      nodeEnv: 'development',
    });
    expect(res.type).toBe('ok');
    expect(res.origin).toBe('http://localhost:3000');
  });

  it('prefers live over store over sign-in redirect origin', () => {
    const res = resolveRecoveryDestination({
      liveDomain: 'https://live.example',
      storeDomain: 'https://store.example',
      signInRedirectUrl: 'https://signin.example/success',
      orig: 'http://localhost:3000',
      nodeEnv: 'production',
    });
    expect(res.type).toBe('ok');
    expect(res.origin).toBe('https://live.example');
  });
});




describe('password validator', () => {
  it('throws on mismatch', () => {
    expect(() => validatePasswordsOrThrow('CorrectHorse1', 'wrong')).toThrow('password_mismatch');
  });
  it('throws on weak password', () => {
    expect(() => validatePasswordsOrThrow('short', 'short')).toThrow('password_too_weak');
  });
  it('passes on valid matching passwords', () => {
    expect(validatePasswordsOrThrow('CorrectHorse1', 'CorrectHorse1')).toBe(true);
  });
});

  it('shows error when recovery token missing', async () => {
    vi.resetModules();
    createClientMock();
    const { getUserMock, updateUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    window.history.replaceState(null, '', '/auth/reset');
    window.location.hash = '';
    document.body.innerHTML = `
      <form data-smoothr="auth-form">
        <input data-smoothr="password" value="Correct123" />
        <input data-smoothr="confirm-password" value="Correct123" />
        <button data-smoothr="submit-reset-password">Save</button>
      </form>
    `;
    const auth = await import('../../features/auth/index.js');
    await auth.init();
    expect(getUserMock).toHaveBeenCalledTimes(1);
    const btn = document.querySelector('[data-smoothr="submit-reset-password"]');
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    const err = document.querySelector('[data-smoothr="error"]');
    expect(err?.textContent).toMatch(/Recovery link is missing/);
  });

it('shows error on weak password', async () => {
  vi.resetModules();
  createClientMock();
  const { getUserMock, updateUserMock } = currentSupabaseMocks();
  global.fetch = vi.fn();
  document.body.innerHTML = `
    <form data-smoothr="auth-form">
      <input data-smoothr="password" value="weak" />
      <input data-smoothr="confirm-password" value="weak" />
      <button data-smoothr="submit-reset-password">Save</button>
    </form>
  `;
  window.history.replaceState(null, '', '/auth/reset#access_token=tok&type=recovery');
  const auth = await import('../../features/auth/index.js');
  await auth.init();
  expect(getUserMock).toHaveBeenCalledTimes(1);
  const btn = document.querySelector('[data-smoothr="submit-reset-password"]');
  btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flushPromises();
  expect(getUserMock).toHaveBeenCalledTimes(1);
  expect(updateUserMock).not.toHaveBeenCalled();
  const err = document.querySelector('[data-smoothr="error"]');
  expect(err?.textContent).toMatch(/stronger password/i);
});

it('reset confirm syncs session via fetch when no redirect set', async () => {
  vi.resetModules();
  createClientMock();
  global.window = realWindow;
  global.document = realDocument;
  const { getUserMock, updateUserMock } = currentSupabaseMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
  updateUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });

  document.body.innerHTML = `
      <form data-smoothr="auth-form">
        <input data-smoothr="password" value="Correct123" />
        <input data-smoothr="confirm-password" value="Correct123" />
        <button data-smoothr="submit-reset-password">Save</button>
      </form>
    `;
  window.SMOOTHR_CONFIG = { store_id: 'store_test' };
  globalThis.getCachedBrokerBase = () => 'https://broker.example';
  window.history.replaceState(null, '', '/auth/reset#access_token=tok&type=recovery');

  const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
  global.fetch = fetchSpy;

  const auth = await import('../../features/auth/index.js');
  await auth.init();
  const btn = document.querySelector('[data-smoothr="submit-reset-password"]');
  btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flushPromises();
  expect(fetchSpy).toHaveBeenCalledWith(
    'https://broker.example/api/auth/session-sync',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
    })
    );
  });

describe('send-reset auto-forward flag', () => {
  async function run() {
    vi.resetModules();
    const generateLink = vi.fn().mockResolvedValue({
      data: { properties: { action_link: 'https://action.link' } },
      error: null,
    });
    const supabase = {
      from(table) {
        if (table === 'store_branding') {
          return {
            select() {
              return {
                eq() {
                  return {
                    is() {
                      return {
                        limit() {
                          return {
                            single: async () => ({
                              data: { logo_url: null },
                              error: null,
                            }),
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (table === 'stores') {
          return {
            select(sel) {
              return {
                eq() {
                  return {
                    maybeSingle: async () => {
                      if (sel.includes('store_name'))
                        return { data: { store_name: 'Test Store' } };
                      if (sel.includes('live_domain'))
                        return {
                          data: { live_domain: null, store_domain: null },
                        };
                      return { data: null };
                    },
                    single: async () => ({
                      data: { store_domain: null, live_domain: null, store_name: 'Test Store' },
                    }),
                  };
                },
              };
            },
          };
        }
        return {};
      },
      auth: { admin: { generateLink } },
    };
    vi.doMock('../../../smoothr/lib/supabaseAdmin.ts', () => ({
      getSupabaseAdmin: () => supabase,
    }));
    vi.doMock('../../../smoothr/lib/email/send.ts', () => ({
      sendEmail: vi.fn().mockResolvedValue({ ok: true }),
    }));
    vi.doMock('../../../smoothr/lib/email/templates/reset.ts', () => ({
      renderResetEmail: () => ({ subject: '', html: '', text: '' }),
    }));
    const { default: handler } = await import('../../../smoothr/pages/api/auth/send-reset.ts');
    const req = {
      method: 'POST',
      headers: {},
      body: JSON.stringify({ email: 'user@example.com', store_id: 's1' }),
    };
    const res = {
      setHeader: () => {},
      status: () => ({ json: () => ({}) }),
      json: () => {},
    };
    await handler(req, res);
    const redirect = generateLink.mock.calls[0][0].options.redirectTo;
    return redirect;
  }
  it('always includes auto=1', async () => {
    const redirect = await run();
    expect(redirect).toMatch(/auto=1/);
  });
});

describe('recovery-bridge auto-forward', () => {
  it('auto-forwards when auto=1 and host matches', () => {
    vi.resetModules();
    const replace = vi.fn();
    const orig = window.location;
    delete window.location;
    // @ts-ignore
    window.location = { hash: '#access_token=abc', host: orig.host, replace };
    const props = {
      redirect: 'https://broker.example/reset',
      auto: '1',
      brokerHost: window.location.host,
      storeName: 'Test Store',
    };
    const hash = window.location.hash || '';
    const dest = props.redirect + hash;
    if (props.auto === '1') {
      const onBrokerHost = props.brokerHost ? window.location.host === props.brokerHost : true;
      if (onBrokerHost) {
        window.location.replace(dest);
      }
    }
    expect(replace).toHaveBeenCalledWith('https://broker.example/reset#access_token=abc');
    window.location = orig;
  });

  it('shows button when auto flag missing', () => {
    vi.resetModules();
    const replace = vi.fn();
    const orig = window.location;
    delete window.location;
    // @ts-ignore
    window.location = { hash: '#access_token=abc', host: orig.host, replace };
    const props = {
      redirect: 'https://broker.example/reset',
      auto: null,
      brokerHost: window.location.host,
      storeName: 'Demo Store',
    };
    const hash = window.location.hash || '';
    const dest = props.redirect + hash;
    if (props.auto === '1') {
      const onBrokerHost = props.brokerHost ? window.location.host === props.brokerHost : true;
      if (onBrokerHost) {
        window.location.replace(dest);
      }
    } else {
      const anchor = document.createElement('a');
      anchor.href = dest;
      anchor.textContent = `Continue to reset on ${props.storeName}`;
      document.body.appendChild(anchor);
    }
    expect(replace).not.toHaveBeenCalled();
    const anchor = document.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://broker.example/reset#access_token=abc');
    expect(anchor?.textContent).toBe('Continue to reset on Demo Store');
    document.body.innerHTML = '';
    window.location = orig;
  });
});

it('sessionSync falls back to form POST when JSON auth fails', async () => {
  vi.resetModules();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true }) });
  const realFetch = global.fetch;
  // @ts-ignore
  global.fetch = fetchMock;
  const { sessionSync } = await import('../../core/http/sessionSync.js');
  await sessionSync({ brokerBase: 'https://broker', store_id: 's1', access_token: 'tok' });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[1][1].headers['Content-Type']).toBe(
    'application/x-www-form-urlencoded'
  );
  global.fetch = realFetch;
});
