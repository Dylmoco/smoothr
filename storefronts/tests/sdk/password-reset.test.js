import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClientMock, currentSupabaseMocks } from "../utils/supabase-mock";

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
    expect(resetPasswordMock).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringMatching(`^${broker}/auth/recovery-bridge`),
      })
    );
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

describe("password reset confirmation", () => {
  let clickHandler;
  let passwordValue;
  let confirmValue;
  let passwordInputObj;
  let confirmInputObj;

  beforeEach(async () => {
    vi.resetModules();
    createClientMock();
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    updateUserMock.mockClear();
    setSessionMock.mockClear();
    passwordValue = "newpass123";
    confirmValue = "newpass123";
    clickHandler = undefined;
    passwordInputObj = {
      value: passwordValue,
      addEventListener: vi.fn(),
    };
    confirmInputObj = { value: confirmValue, addEventListener: vi.fn() };
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      tagName: "FORM",
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="password"]') return passwordInputObj;
        if (sel === '[data-smoothr="password-confirm"]') return confirmInputObj;
        if (sel === '[data-smoothr="password-reset-confirm"]') return btn;
        return null;
      }),
    };
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "password-reset-confirm" },
      getAttribute: (attr) =>
        attr === "data-smoothr" ? "password-reset-confirm" : null,
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
      closest: vi.fn(() => form),
    };
    global.window = {
      location: { href: "", origin: "", hash: "#access_token=a&refresh_token=b" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((sel) => {
        if (sel.includes('[data-smoothr="password-reset-confirm"]')) return [btn];
        if (sel.includes('[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
    };
    global.alert = global.window.alert = vi.fn();
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  it("updates password and redirects", async () => {
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    await auth.initPasswordResetConfirmation({ redirectTo: "/login" });
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(setSessionMock).toHaveBeenCalledWith({
      access_token: "a",
      refresh_token: "b",
    });
    expect(updateUserMock).toHaveBeenCalledWith({ password: "newpass123" });
  });

  it("handles update failure", async () => {
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({ data: null, error: new Error("fail") });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    await auth.initPasswordResetConfirmation({ redirectTo: "/login" });
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(setSessionMock).toHaveBeenCalledWith({
      access_token: "a",
      refresh_token: "b",
    });
    expect(updateUserMock).toHaveBeenCalledWith({ password: "newpass123" });
  });

  it("validates strength and match", async () => {
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    await auth.initPasswordResetConfirmation({ redirectTo: "/login" });
    await flushPromises();
    passwordValue = "short";
    confirmValue = "short";
    passwordInputObj.value = passwordValue;
    confirmInputObj.value = confirmValue;
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(updateUserMock).not.toHaveBeenCalled();
    updateUserMock.mockClear();
    passwordValue = "Password1";
    confirmValue = "Different1";
    passwordInputObj.value = passwordValue;
    confirmInputObj.value = confirmValue;
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("sets window.Smoothr.auth.user after update", async () => {
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    const user = { id: "1", email: "test@example.com" };
    updateUserMock.mockResolvedValue({ data: { user }, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    await auth.initPasswordResetConfirmation({ redirectTo: "/login" });
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(setSessionMock).toHaveBeenCalled();
    expect(updateUserMock).toHaveBeenCalledWith({ password: "newpass123" });
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
  });
});

describe("password reset confirmation transport", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    createClientMock();
    global.window = realWindow;
    global.document = realDocument;
    window.location.hash = '#access_token=a&refresh_token=b';
    window.SMOOTHR_CONFIG = { storeId: '1' };
    document.body.innerHTML = '';
  });

  it("uses form POST when redirect configured", async () => {
    window.SMOOTHR_CONFIG.sign_in_redirect_url = '/';
    document.body.innerHTML = `
      <form data-smoothr="auth-form">
        <input data-smoothr="password" value="Password1" />
        <input data-smoothr="password-confirm" value="Password1" />
        <div data-smoothr="password-reset-confirm"></div>
      </form>`;

    const { updateUserMock, setSessionMock, getSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });

    const auth = await import("../../features/auth/index.js");
    await auth.initPasswordResetConfirmation();
    await flushPromises();

    const fetchSpy = vi.spyOn(window, 'fetch');
    const signedIn = vi.fn();
    const closed = vi.fn();
    document.addEventListener('smoothr:auth:signedin', signedIn);
    document.addEventListener('smoothr:auth:close', closed);

    document.querySelector('[data-smoothr="password-reset-confirm"]').dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(signedIn).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it("uses XHR when no redirect configured", async () => {
    window.SMOOTHR_CONFIG.sign_in_redirect_url = null;
    document.body.innerHTML = `
      <form data-smoothr="auth-form">
        <input data-smoothr="password" value="Password1" />
        <input data-smoothr="password-confirm" value="Password1" />
        <div data-smoothr="password-reset-confirm"></div>
      </form>`;

    const { updateUserMock, setSessionMock, getSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });

    const auth = await import("../../features/auth/index.js");
    await auth.initPasswordResetConfirmation();
    await flushPromises();

    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, redirect_url: null, sign_in_redirect_url: null }),
    });
    const createElSpy = vi.spyOn(document, 'createElement');
    const signedIn = vi.fn();
    const closed = vi.fn();
    document.addEventListener('smoothr:auth:signedin', signedIn);
    document.addEventListener('smoothr:auth:close', closed);

    document.querySelector('[data-smoothr="password-reset-confirm"]').dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toMatch(/\/api\/auth\/session-sync$/);
    expect(createElSpy).not.toHaveBeenCalledWith('form');
    expect(signedIn).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
  });

});

describe('password reset confirm errors', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    createClientMock();
    global.window = realWindow;
    global.document = realDocument;
    window.location.hash = '#access_token=a&refresh_token=b&type=recovery';
    document.body.innerHTML = `
      <form data-smoothr="auth-form">
        <input data-smoothr="password" value="A" />
        <input data-smoothr="password-confirm" value="B" />
        <div data-smoothr="password-reset-confirm"></div>
      </form>`;
  });

  it('mismatch prevents updateUser and shows error', async () => {
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    const auth = await import('../../features/auth/index.js');
    await auth.initPasswordResetConfirmation();
    await flushPromises();
    document.querySelector('[data-smoothr="password-reset-confirm"]').dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(setSessionMock).not.toHaveBeenCalled();
    const err = document.querySelector('[data-smoothr="error"]');
    expect(err?.textContent).toBe('Passwords do not match.');
  });

  it('weak password shows friendly error', async () => {
    document.querySelector('[data-smoothr="password"]').value = 'Password1';
    document.querySelector('[data-smoothr="password-confirm"]').value = 'Password1';
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({
      data: null,
      error: { message: 'password is too short', code: 'weak_password' },
    });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    const auth = await import('../../features/auth/index.js');
    await auth.initPasswordResetConfirmation();
    await flushPromises();
    document.querySelector('[data-smoothr="password-reset-confirm"]').dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();
    const err = document.querySelector('[data-smoothr="error"]');
    expect(err?.textContent).toBe('Please choose a stronger password.');
  });

  it('expired link shows friendly error', async () => {
    document.querySelector('[data-smoothr="password"]').value = 'Password1';
    document.querySelector('[data-smoothr="password-confirm"]').value = 'Password1';
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({
      data: null,
      error: { message: 'invalid token', code: 'invalid_token' },
    });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    const auth = await import('../../features/auth/index.js');
    await auth.initPasswordResetConfirmation();
    await flushPromises();
    document.querySelector('[data-smoothr="password-reset-confirm"]').dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();
    const err = document.querySelector('[data-smoothr="error"]');
    expect(err?.textContent).toBe('Your reset link is invalid or has expired. Please request a new one.');
  });

  it('strips recovery hash after session set', async () => {
    document.querySelector('[data-smoothr="password"]').value = 'Password1';
    document.querySelector('[data-smoothr="password-confirm"]').value = 'Password1';
    window.location.pathname = '/reset-password';
    window.location.search = '';
    window.location.hash = '#access_token=XYZ&refresh_token=R&type=recovery';
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const { updateUserMock, setSessionMock } = currentSupabaseMocks();
    updateUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    const auth = await import('../../features/auth/index.js');
    await auth.initPasswordResetConfirmation();
    await flushPromises();
    document.querySelector('[data-smoothr="password-reset-confirm"]').dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();
    expect(replaceSpy).toHaveBeenCalled();
    const urlArg = replaceSpy.mock.calls[0][2];
    expect(urlArg).not.toContain('access_token');
    expect(urlArg).not.toContain('#');
  });
});
