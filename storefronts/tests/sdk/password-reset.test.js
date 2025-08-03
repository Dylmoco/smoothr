// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";

var resetPasswordMock;
var updateUserMock;
var setSessionMock;
var getUserMock;
var createClientMock;

vi.mock("@supabase/supabase-js", () => {
  resetPasswordMock = vi.fn();
  updateUserMock = vi.fn();
  setSessionMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: resetPasswordMock,
      updateUser: updateUserMock,
      setSession: setSessionMock,
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

import * as auth from "../../core/auth/index.js";

vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");

function flushPromises() {
  return new Promise(setImmediate);
}

describe("password reset request", () => {
  let clickHandler;
  let emailValue;

  beforeEach(() => {
    emailValue = "user@example.com";
    clickHandler = undefined;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]')
          return { value: emailValue };
        return null;
      }),
    };
    const btn = {
      dataset: { smoothr: "password-reset" },
      getAttribute: (attr) =>
        attr === "data-smoothr" ? "password-reset" : null,
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
      closest: vi.fn(() => form),
    };
    global.window = {
      location: { href: "", origin: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((sel) =>
        sel.includes('[data-smoothr="password-reset"]') ? [btn] : [],
      ),
    };
    global.alert = global.window.alert = vi.fn();
  });

  it("sends reset email", async () => {
    resetPasswordMock.mockResolvedValue({ data: {}, error: null });
    auth.initAuth();
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(resetPasswordMock).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "",
    });
    expect(global.window.alert).toHaveBeenCalled();
  });

  it("handles failure", async () => {
    resetPasswordMock.mockResolvedValue({
      data: null,
      error: new Error("bad"),
    });
    auth.initAuth();
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

  beforeEach(() => {
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
    const form = {
      dataset: { smoothr: "auth-form" },
      tagName: "FORM",
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="password"]') return passwordInputObj;
        if (sel === '[data-smoothr="password-confirm"]') return confirmInputObj;
        return null;
      }),
    };
    const btn = {
      dataset: { smoothr: "password-reset-confirm" },
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
      querySelectorAll: vi.fn((sel) =>
        sel.includes('[data-smoothr="password-reset-confirm"]') ? [btn] : [],
      ),
    };
    global.alert = global.window.alert = vi.fn();
  });

  it("updates password and redirects", async () => {
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    auth.initPasswordResetConfirmation({ redirectTo: "/login" });
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(setSessionMock).toHaveBeenCalledWith({
      access_token: "a",
      refresh_token: "b",
    });
    expect(updateUserMock).toHaveBeenCalledWith({ password: "newpass123" });
    expect(global.window.alert).toHaveBeenCalled();
  });

  it("handles update failure", async () => {
    updateUserMock.mockResolvedValue({ data: null, error: new Error("fail") });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    auth.initPasswordResetConfirmation({ redirectTo: "/login" });
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.alert).toHaveBeenCalled();
  });

  it("validates strength and match", async () => {
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    auth.initPasswordResetConfirmation({ redirectTo: "/login" });
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

  it("sets window.smoothr.auth.user after update", async () => {
    const user = { id: "1", email: "test@example.com" };
    updateUserMock.mockResolvedValue({ data: { user }, error: null });
    setSessionMock.mockResolvedValue({ data: {}, error: null });
    auth.initPasswordResetConfirmation({ redirectTo: "/login" });
    await flushPromises();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.smoothr.auth.user).toEqual(user);
  });
});
