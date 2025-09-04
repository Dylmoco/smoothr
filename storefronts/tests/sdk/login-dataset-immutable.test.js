// [Codex Fix] New test for immutable dataset
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createClientMock as createClientMockUtil,
  currentSupabaseMocks,
} from "../utils/supabase-mock";
import { createDomStub } from "../utils/dom-stub";

var signInMock;
var getUserMock;

vi.mock("@supabase/supabase-js", () => {
  signInMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  const createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInMock,
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
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

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  globalThis.fetch?.mockRestore?.();
});

describe("login with immutable dataset", () => {
  let clickHandler;
  let emailValue;
  let passwordValue;
  let loginTrigger;
  let resetTrigger;
  let googleTrigger;

  let realDocument;
  beforeEach(async () => {
    vi.resetModules();
    createClientMockUtil();
    ({ signInMock, getUserMock } = currentSupabaseMocks());
    getUserMock.mockResolvedValue({ data: { user: null } });
    clickHandler = undefined;
    emailValue = "user@example.com";
    passwordValue = "Password1";

    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]') return { value: emailValue };
        if (sel === '[data-smoothr="password"]') return { value: passwordValue };
        if (sel === '[data-smoothr="login"]') return loginTrigger;
        if (sel === '[data-smoothr="password-reset"]') return resetTrigger;
        if (sel === '[data-smoothr="login-google"]') return googleTrigger;
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

    resetTrigger = {
      tagName: "DIV",
      closest: vi.fn(() => form),
      dataset: { smoothr: "password-reset" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "password-reset" : null),
      addEventListener: vi.fn(),
    };
    Object.freeze(resetTrigger.dataset);

    googleTrigger = {
      tagName: "DIV",
      closest: vi.fn(() => form),
      dataset: { smoothr: "login-google" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "login-google" : null),
      addEventListener: vi.fn(),
    };
    Object.freeze(googleTrigger.dataset);

    global.window = {
      location: { href: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    realDocument = global.document;
    global.document = createDomStub({
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn((sel) => {
        if (sel.includes('[data-smoothr="login"]')) return [loginTrigger];
        if (sel.includes('[data-smoothr="login-google"]') && sel.includes('[data-smoothr="password-reset"]'))
          return [resetTrigger, googleTrigger];
        if (sel.includes('[data-smoothr="password-reset"]')) return [resetTrigger];
        if (sel.includes('[data-smoothr="login-google"]')) return [googleTrigger];
        if (sel.includes('[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
      dispatchEvent: vi.fn(),
    });
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  afterEach(() => {
    global.document = realDocument;
  });

  it("logs in even when dataset is immutable", async () => {
    signInMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init();
    await flushPromises();

    expect(loginTrigger.dataset.smoothrBoundAuth).toBeUndefined();

    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInMock).toHaveBeenCalled();
  });

  it("binds login, reset and oauth triggers when dataset is immutable", async () => {
    await auth.init();
    await flushPromises();
    expect(loginTrigger.addEventListener).toHaveBeenCalled();
    expect(resetTrigger.addEventListener).toHaveBeenCalled();
    expect(googleTrigger.addEventListener).toHaveBeenCalled();
  });
});
