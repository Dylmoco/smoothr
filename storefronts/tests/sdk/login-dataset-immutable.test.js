// [Codex Fix] New test for immutable dataset
import { describe, it, expect, vi, beforeEach } from "vitest";

var signInMock;
var getUserMock;
var createClientMock;

vi.mock("@supabase/supabase-js", () => {
  signInMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInMock,
      signOut: vi.fn(),
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

describe("login with immutable dataset", () => {
  let clickHandler;
  let emailValue;
  let passwordValue;
  let loginTrigger;

  beforeEach(() => {
    clickHandler = undefined;
    emailValue = "user@example.com";
    passwordValue = "Password1";

    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]')
          return { value: emailValue };
        if (sel === '[data-smoothr="password"]')
          return { value: passwordValue };
        if (sel === '[data-smoothr="login"]') return loginTrigger;
        return null;
      }),
    };
    Object.freeze(form.dataset);

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
    Object.freeze(loginTrigger.dataset);

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
  });

  it("logs in even when dataset is immutable", async () => {
    signInMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    auth.initAuth();
    await flushPromises();

    expect(loginTrigger.dataset.smoothrBoundAuth).toBeUndefined();

    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInMock).toHaveBeenCalled();
  });
});
