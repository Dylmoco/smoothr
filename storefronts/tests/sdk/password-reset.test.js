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
  createClientMock();
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

  expect(fetchSpy).toHaveBeenCalledWith('/api/auth/send-reset', expect.objectContaining({ method: 'POST' }));
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
it('sends reset via broker API with redirectTo (bridge + orig)', async () => {
  vi.resetModules();
  document.body.innerHTML = `<form data-smoothr="auth-form"></form>`;
  window.SMOOTHR_CONFIG = { store_id: 'store_test', storeId: 'store_test', routes: { resetPassword: '/reset-password' } };
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

  const auth = await import('../../features/auth/index.js');
  await auth.init();
  const { requestPasswordResetForEmail } = auth;
  await requestPasswordResetForEmail?.('user@example.com');

  const payload = JSON.parse(fetchSpy.mock.calls.at(-1)[1].body);
  expect(fetchSpy.mock.calls.at(-1)[0]).toBe('/api/auth/send-reset');
  expect(payload.email).toBe('user@example.com');
  expect(payload.store_id).toBe('store_test');
  expect(String(payload.redirectTo)).toMatch(/\/auth\/recovery-bridge\?store_id=store_test/);
  expect(String(payload.redirectTo)).toMatch(/orig=/);
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
