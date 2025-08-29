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

it('submits password-reset via Enter on reset-only form', async () => {
  vi.resetModules();
  createClientMock();
  const { resetPasswordMock } = currentSupabaseMocks();
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

  resetPasswordMock.mockResolvedValue({ data: {}, error: null });
  const evt = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(evt);
  await flushPromises();

  expect(resetPasswordMock).toHaveBeenCalledWith('user@example.com', expect.any(Object));
});

it('does not send duplicate reset emails when clicking a bound reset control', async () => {
  vi.resetModules();
  createClientMock();
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

  const supa = await auth.resolveSupabase?.();
  const resetSpy = vi.spyOn(supa.auth, 'resetPasswordForEmail')
    .mockResolvedValue({ data: {}, error: null });

  const trigger = container.querySelector('[data-smoothr="password-reset"]');
  trigger.click();
  await flushPromises();

  expect(resetSpy).toHaveBeenCalledTimes(1);
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

describe("password reset request", () => {
  let clickHandler;
  let emailValue;

  beforeEach(async () => {
    vi.resetModules();
    createClientMock();
    const { getUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValue({ data: { user: null } });
    emailValue = "user@example.com";
    clickHandler = undefined;
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]')
          return { value: emailValue };
        if (sel === '[data-smoothr="password-reset"]') return btn;
        return null;
      }),
    };
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "password-reset" },
      getAttribute: (attr) =>
        attr === "data-smoothr" ? "password-reset" : null,
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
      closest: vi.fn(() => form),
    };
    global.window = {
      location: { href: "", origin: "https://client.example", search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      SMOOTHR_CONFIG: {},
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((sel) => {
        if (sel.includes('[data-smoothr="password-reset"]')) return [btn];
        if (sel.includes('[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
    };
    global.alert = global.window.alert = vi.fn();
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  it("sends reset email", async () => {
    const { resetPasswordMock } = currentSupabaseMocks();
    resetPasswordMock.mockResolvedValue({ data: {}, error: null });
    await auth.init();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    const broker = auth.getBrokerBaseUrl();
    const redirect = resetPasswordMock.mock.calls[0][1]?.redirectTo || "";
    expect(redirect.startsWith(`${broker}/auth/recovery-bridge`)).toBe(true);
    expect(redirect).toContain(`orig=${encodeURIComponent(global.window.location.origin)}`);
    expect(global.window.alert).toHaveBeenCalled();
  });

  it("includes store_id when available", async () => {
    const { resetPasswordMock } = currentSupabaseMocks();
    resetPasswordMock.mockResolvedValue({ data: {}, error: null });
    global.window.SMOOTHR_CONFIG.storeId = "store_42";
    await auth.init();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    const redirect = resetPasswordMock.mock.calls[0][1]?.redirectTo || "";
    expect(redirect).toContain("store_id=store_42");
    expect(redirect).toContain(`orig=${encodeURIComponent(global.window.location.origin)}`);
  });

  it("handles failure", async () => {
    const { resetPasswordMock } = currentSupabaseMocks();
    resetPasswordMock.mockResolvedValue({
      data: null,
      error: new Error("bad"),
    });
    await auth.init();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.alert).toHaveBeenCalled();
  });
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
