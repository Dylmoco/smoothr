// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";

let signUpMock;
let getUserMock;
let createClientMock;
let getSessionMock;

function setupSupabaseMock() {
  signUpMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  getSessionMock = vi.fn(() =>
    Promise.resolve({ data: { session: {} }, error: null })
  );
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signUp: signUpMock,
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: getSessionMock,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  }));
  vi.doMock("@supabase/supabase-js", () => ({
    createClient: createClientMock,
  }));
}

let auth;
const config = { storeId: "00000000-0000-0000-0000-000000000000" };

function flushPromises() {
  return new Promise(setImmediate);
}

it('routes dynamic sign-up DIV click via capture fallback when auth-form is DIV', async () => {
  vi.resetModules();
  setupSupabaseMock();
  const auth = await import("../../features/auth/index.js");
  await auth.init({ supabase: createClientMock() });
  await flushPromises();

  const div = document.createElement('div');
  div.setAttribute('data-smoothr', 'auth-form');
  div.innerHTML = `
    <input data-smoothr="email" value="new@example.com" />
    <input data-smoothr="password" value="LongerPass9" />
    <input data-smoothr="password-confirm" value="LongerPass9" />
  `;
  document.body.appendChild(div);
  const signup = document.createElement('div');
  signup.setAttribute('data-smoothr', 'sign-up');
  div.appendChild(signup);

  const supa = await auth.resolveSupabase?.();
  const signUpSpy = vi.spyOn(supa.auth, 'signUp').mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });

  signup.click();
  await flushPromises();

  expect(signUpSpy).toHaveBeenCalledTimes(1);
});

describe("signup flow", () => {
  let clickHandler;
  let emailValue;
  let passwordValue;
  let confirmValue;

  beforeEach(async () => {
    vi.resetModules();
    delete globalThis["__supabaseAuthClientsmoothr-browser-client"];
    setupSupabaseMock();
    signUpMock.mockClear();
    getUserMock.mockClear();
    getSessionMock.mockClear();
    emailValue = "test@example.com";
    passwordValue = "Password1";
    confirmValue = "Password1";
    clickHandler = undefined;
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((selector) => {
        if (selector === '[data-smoothr="email"]') return { value: emailValue };
        if (selector === '[data-smoothr="password"]')
          return { value: passwordValue };
        if (selector === '[data-smoothr="password-confirm"]')
          return { value: confirmValue };
        if (selector === '[data-smoothr="sign-up"]') return btn;
        return null;
      }),
    };
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "sign-up" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "sign-up" : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
      closest: vi.fn(() => form),
    };

    global.window = {
      location: { href: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      SMOOTHR_CONFIG: { storeId: config.storeId },
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((sel) => {
        if (sel.includes('[data-smoothr="sign-up"]')) return [btn];
        if (sel.includes('form[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
      dispatchEvent: vi.fn(),
    };
    global.document.dispatchEvent.mockClear();
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  it("signs up and redirects on success", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "Password1",
      options: { data: { store_id: config.storeId } },
    });
    expect(global.document.dispatchEvent).toHaveBeenCalled();
  });

  it("does nothing on signup failure", async () => {
    signUpMock.mockResolvedValue({ data: null, error: new Error("bad") });
    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.document.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'smoothr:auth:error' }));
    expect(global.window.location.href).toBe("");
  });

  it("validates email and password", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    emailValue = "bademail";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    signUpMock.mockClear();
    passwordValue = "short";
    emailValue = "user@example.com";
    confirmValue = "short";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    signUpMock.mockClear();
    passwordValue = "Password1";
    confirmValue = "Mismatch";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
  });

  it("sets window.Smoothr.auth.user on success", async () => {
    const user = { id: "1" };
    signUpMock.mockResolvedValue({ data: { user }, error: null });
    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    await global.window.Smoothr.auth.client.auth.getSession();
    expect(getSessionMock).toHaveBeenCalled();
  });
});
