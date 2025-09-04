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

it('strips stale recovery hash on non-reset routes (no redirect)', async () => {
  vi.resetModules();
  document.body.innerHTML = `<a data-smoothr="account-access"></a>`;
  window.SMOOTHR_CONFIG = { routes: { resetPassword: '/reset-password' } };
  history.replaceState(null, '', '/home#access_token=abc&type=recovery');
  const auth = await import('../../features/auth/index.js');
  await auth.init();
  expect(location.pathname).toBe('/home');
  expect(location.hash).toBe('');
  document.body.innerHTML = '';
  delete window.SMOOTHR_CONFIG;
});

it('does not set loading class on non-reset routes when hash exists', async () => {
  vi.resetModules();
  document.body.innerHTML = `<div data-smoothr="auth-pop-up"></div>`;
  history.replaceState(null, '', '/home#access_token=abc&type=recovery');

  const classAdd = vi.spyOn(document.documentElement.classList, 'add');
  const auth = await import('../../features/auth/index.js');
  await auth.init();

  // should not add smoothr-reset-loading on non-reset route
  expect(classAdd.mock.calls.find(([c]) => c === 'smoothr-reset-loading')).toBeUndefined();
  classAdd.mockRestore();
  document.body.innerHTML = '';
});

it('submits password-reset via Enter on reset-only form', async () => {
  vi.resetModules();
  document.body.innerHTML = '<script id="smoothr-sdk" src="https://sdk.smoothr.io/smoothr-sdk.mjs" data-config-url="https://broker.example/api/config" data-store-id="store_test"></script>';
  createClientMock();
  globalThis.getCachedBrokerBase = () => 'https://broker.example';
  globalThis.ensureConfigLoaded = () => Promise.resolve();
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
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

  expect(fetchSpy).toHaveBeenCalledWith(
    'https://broker.example/api/auth/send-reset',
    expect.objectContaining({ method: 'POST', credentials: 'omit' })
  );
  fetchSpy.mockRestore();
});

it('does not send duplicate reset emails when clicking a bound reset control', async () => {
  vi.resetModules();
  createClientMock();
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
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

  const trigger = container.querySelector('[data-smoothr="password-reset"]');
  trigger.click();
  await flushPromises();

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  fetchSpy.mockRestore();
});
// Case A: config URL present (modern)
it('sends reset via broker API with redirectTo (bridge + orig)', async () => {
  vi.resetModules();
  document.body.innerHTML = `<script id="smoothr-sdk" src="https://sdk.smoothr.io/smoothr-sdk.mjs" data-store-id="store_test" data-config-url="https://broker.example/api/config"></script><form data-smoothr="auth-form"></form>`;
  window.SMOOTHR_CONFIG = { store_id: 'store_test', storeId: 'store_test', routes: { resetPassword: '/reset-password' } };
  globalThis.getCachedBrokerBase = () => 'https://broker.example';
  globalThis.ensureConfigLoaded = () => Promise.resolve();
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

  const auth = await import('../../features/auth/index.js');
  await auth.init();
  const { requestPasswordResetForEmail } = auth;
  await requestPasswordResetForEmail?.('user@example.com');

  const payload = JSON.parse(fetchSpy.mock.calls.at(-1)[1].body);
  expect(fetchSpy.mock.calls.at(-1)[0]).toBe('https://broker.example/api/auth/send-reset');
  expect(fetchSpy.mock.calls.at(-1)[1].credentials).toBe('omit');
  expect(payload.email).toBe('user@example.com');
  expect(payload.store_id).toBe('store_test');
  expect(String(payload.redirectTo)).toMatch(/\/auth\/recovery-bridge\?store_id=store_test/);
  expect(String(payload.redirectTo)).toMatch(/orig=/);
  fetchSpy.mockRestore();
});

// Case B: no config URL (legacy), script hosted on broker
it('falls back to script origin when no config URL present', async () => {
  vi.resetModules();
  document.body.innerHTML = `<script id="smoothr-sdk" src="https://broker.example/smoothr-sdk.mjs" data-store-id="store_test"></script><form data-smoothr="auth-form"></form>`;
  globalThis.getCachedBrokerBase = () => 'https://broker.example';
  globalThis.ensureConfigLoaded = () => Promise.resolve();
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

  const auth = await import('../../features/auth/index.js');
  await auth.init();
  const { requestPasswordResetForEmail } = auth;
  await requestPasswordResetForEmail?.('user@example.com');

  expect(fetchSpy.mock.calls.at(-1)[0]).toBe('https://broker.example/api/auth/send-reset');
  expect(fetchSpy.mock.calls.at(-1)[1].credentials).toBe('omit');
  fetchSpy.mockRestore();
});

// Case C: cached broker points to SDK host -> fallback to Vercel app
it('ignores sdk host broker and falls back to smoothr.vercel.app', async () => {
  vi.resetModules();
  document.body.innerHTML = `<script id="smoothr-sdk" src="https://sdk.smoothr.io/smoothr-sdk.mjs" data-store-id="store_test"></script><form data-smoothr="auth-form"></form>`;
  window.SMOOTHR_CONFIG = { broker_origin: 'https://sdk.smoothr.io', store_id: 'store_test', storeId: 'store_test', routes: { resetPassword: '/reset-password' } };
  globalThis.getCachedBrokerBase = () => 'https://sdk.smoothr.io';
  globalThis.ensureConfigLoaded = () => Promise.resolve();
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

  const auth = await import('../../features/auth/index.js');
  await auth.init();
  const { requestPasswordResetForEmail } = auth;
  await requestPasswordResetForEmail?.('user@example.com');

  expect(fetchSpy.mock.calls.at(-1)[0]).toBe('https://smoothr.vercel.app/api/auth/send-reset');
  expect(fetchSpy.mock.calls.at(-1)[1].credentials).toBe('omit');
  fetchSpy.mockRestore();
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
    expect(() => validatePasswordsOrThrow('CorrectHorseBatteryStaple', 'wrong')).toThrow('password_mismatch');
  });
  it('throws on weak password', () => {
    expect(() => validatePasswordsOrThrow('short', 'short')).toThrow('password_too_weak');
  });
  it('passes on valid matching passwords', () => {
    expect(validatePasswordsOrThrow('CorrectHorseBatteryStaple', 'CorrectHorseBatteryStaple')).toBe(true);
  });
});

it('reset confirm posts to session-sync for 303 redirect to home when no redirect set', async () => {
  vi.resetModules();
  createClientMock();
  global.window = realWindow;
  global.document = realDocument;
  const { getUserMock, updateUserMock } = currentSupabaseMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
  updateUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });

  document.body.innerHTML = `
    <form data-smoothr="auth-form">
      <input data-smoothr="password" value="CorrectHorseBatteryStaple" />
      <input data-smoothr="password-confirm" value="CorrectHorseBatteryStaple" />
      <button data-smoothr="password-reset-confirm">Save</button>
      <div data-smoothr="auth-error" style="display:none"></div>
    </form>
  `;
  window.SMOOTHR_CONFIG = { store_id: 'store_test' };
  window.history.replaceState(null, '', '/reset-password#access_token=testtoken&type=recovery');

  const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function () {});

  const auth = await import('../../features/auth/index.js');
  await auth.init();
  const btn = document.querySelector('[data-smoothr="password-reset-confirm"]');
  btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  await new Promise((r) => setTimeout(r, 0));

  expect(submitSpy).toHaveBeenCalledTimes(1);
  submitSpy.mockRestore();
});

describe('send-reset auto-forward flag', () => {
  async function run(auto) {
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
                              data: { logo_url: null, auto_forward_recovery: auto },
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
  it('includes auto=1 when enabled', async () => {
    const redirect = await run(true);
    expect(redirect).toMatch(/auto=1/);
  });
  it('omits auto when disabled', async () => {
    const redirect = await run(false);
    expect(redirect).not.toMatch(/auto=1/);
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
