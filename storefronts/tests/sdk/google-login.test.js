// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClientMock, currentSupabaseMocks } from "../utils/supabase-mock";

  var getUserMock;
  var signInWithOAuthMock;
  var legacyCreateClientMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  signInWithOAuthMock = vi.fn(() => Promise.resolve());
  legacyCreateClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: vi.fn(),
      signInWithOAuth: signInWithOAuthMock,
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
  return { createClient: legacyCreateClientMock };
});

let init;

function flushPromises() {
  return new Promise(setImmediate);
}

describe("OAuth login buttons", () => {
  let googleClickHandler;
  let appleClickHandler;
  let store;

  beforeEach(async () => {
    vi.resetModules();
    createClientMock();
    ({ signInWithOAuthMock } = currentSupabaseMocks());
    googleClickHandler = undefined;
    appleClickHandler = undefined;
    store = null;
    global.window = {
      location: { origin: "", href: "", hostname: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      SMOOTHR_CONFIG: { storeId: "test-store" }
    };
    global.localStorage = {
      getItem: vi.fn(() => store),
      setItem: vi.fn((k, v) => {
        store = v;
      }),
      removeItem: vi.fn(),
    };
    const googleBtn = {
      tagName: "DIV",
      dataset: { smoothr: "login-google" },
      getAttribute: (attr) =>
        attr === "data-smoothr" ? "login-google" : null,
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") googleClickHandler = cb;
      }),
      closest: vi.fn(() => null),
    };
    const appleBtn = {
      tagName: "DIV",
      dataset: { smoothr: "login-apple" },
      getAttribute: (attr) =>
        attr === "data-smoothr" ? "login-apple" : null,
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") appleClickHandler = cb;
      }),
      closest: vi.fn(() => null),
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((selector) => {
        const result = [];
        if (selector.includes('[data-smoothr="login-google"]')) result.push(googleBtn);
        if (selector.includes('[data-smoothr="login-apple"]')) result.push(appleBtn);
        return result;
      }),
    };
    ({ init } = await import("../../features/auth/index.js"));
  });

  it("triggers Supabase OAuth sign-in for Google", async () => {
      await init({ supabase: createClientMock() });
    await flushPromises();

    await googleClickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: expect.any(String),
        data: { store_id: "test-store" },
      },
    });
    expect(global.localStorage.getItem("smoothr_oauth")).toBe("1");
  });

  it("triggers Supabase OAuth sign-in for Apple", async () => {
      await init({ supabase: createClientMock() });
    await flushPromises();

    await appleClickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "apple",
      options: {
        redirectTo: expect.any(String),
        data: { store_id: "test-store" },
      },
    });
    expect(global.localStorage.getItem("smoothr_oauth")).toBe("1");
  });
});
