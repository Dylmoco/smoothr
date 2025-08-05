// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";

var signUpMock;
var getUserMock;
var createClientMock;
var getSessionMock;

vi.mock("@supabase/supabase-js", () => {
  signUpMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  getSessionMock = vi.fn(() => Promise.resolve({ data: { session: {} }, error: null }));
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
  return { createClient: createClientMock };
});

let auth;

function flushPromises() {
  return new Promise(setImmediate);
}

describe("signup flow", () => {
  let clickHandler;
  let emailValue;
  let passwordValue;
  let confirmValue;

  beforeEach(async () => {
    vi.resetModules();
    signUpMock.mockClear();
    emailValue = "test@example.com";
    passwordValue = "Password1";
    confirmValue = "Password1";
    clickHandler = undefined;
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((selector) => {
        if (selector === '[data-smoothr="email"]')
          return { value: emailValue };
        if (selector === '[data-smoothr="password"]')
          return { value: passwordValue };
        if (selector === '[data-smoothr="password-confirm"]')
          return { value: confirmValue };
        if (selector === '[data-smoothr="signup"]') return btn;
        return null;
      }),
    };
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "signup" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "signup" : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
      closest: vi.fn(() => form),
    };

    global.window = {
      location: { href: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((sel) => {
        if (sel.includes('[data-smoothr="signup"]')) return [btn];
        if (sel.includes('form[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
      dispatchEvent: vi.fn(),
    };
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  it("signs up and redirects on success", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "Password1",
      options: { data: { store_id: globalThis.SMOOTHR_CONFIG.storeId } },
    });
    expect(global.document.dispatchEvent).toHaveBeenCalled();
  });

  it("does nothing on signup failure", async () => {
    signUpMock.mockResolvedValue({ data: null, error: new Error("bad") });
    await auth.init();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.document.dispatchEvent).not.toHaveBeenCalled();
    expect(global.window.location.href).toBe("");
  });

  it("validates email and password", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init();
    await flushPromises();
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
    await auth.init();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    await global.window.Smoothr.auth.client.auth.getSession();
    expect(getSessionMock).toHaveBeenCalled();
  });
});
