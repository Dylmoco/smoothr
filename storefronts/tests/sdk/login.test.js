// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClientMock, currentSupabaseMocks } from "../utils/supabase-mock";

var signInMock;
var getUserMock;
var createClientMock;
var getSessionMock;

vi.mock("@supabase/supabase-js", () => {
  signInMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  getSessionMock = vi.fn(() => Promise.resolve({ data: { session: {} }, error: null }));
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInMock,
      signOut: vi.fn(),
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

describe("login form", () => {
  let clickHandler;
  let emailValue;
  let passwordValue;

  beforeEach(async () => {
    vi.resetModules();
    createClientMock();
    ({ signInMock, getUserMock, getSessionMock } = currentSupabaseMocks());
    getUserMock.mockResolvedValue({ data: { user: null } });
    clickHandler = undefined;
    emailValue = "user@example.com";
    passwordValue = "Password1";

    let loginTrigger;
    const form = {
      dataset: { smoothr: "auth-form" },
      addEventListener: vi.fn(),
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]')
          return { value: emailValue };
        if (sel === '[data-smoothr="password"]')
          return { value: passwordValue };
        if (sel === '[data-smoothr="login"]') return loginTrigger;
        return null;
      }),
    };
    loginTrigger = {
      tagName: "DIV",
      closest: vi.fn(() => form),
      dataset: { smoothr: "login" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "login" : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
      textContent: "Login",
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
        if (sel.includes('[data-smoothr="login"]')) return [loginTrigger];
        if (sel.includes('form[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
      dispatchEvent: vi.fn(),
    };
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  it("validates email before login", async () => {
    signInMock.mockResolvedValue({ data: {}, error: null });
    await auth.init();
    await flushPromises();

    emailValue = "bad";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signInMock).not.toHaveBeenCalled();

    emailValue = "user@example.com";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signInMock).toHaveBeenCalled();
  });

  it("sets window.Smoothr.auth.user on success", async () => {
    const user = { id: "1", email: "user@example.com" };
    signInMock.mockResolvedValue({ data: { user }, error: null });
    await auth.init();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    await global.window.Smoothr.auth.client.auth.getSession();
    expect(getSessionMock).toHaveBeenCalled();
  });
});
