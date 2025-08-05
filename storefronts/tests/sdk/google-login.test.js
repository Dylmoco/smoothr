// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";

var getUserMock;
var signInWithOAuthMock;
var createClientMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  signInWithOAuthMock = vi.fn(() => Promise.resolve());
  createClientMock = vi.fn(() => ({
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
  return { createClient: createClientMock };
});

import { initAuth } from "../../features/auth/index.js";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("OAuth login buttons", () => {
  let googleClickHandler;
  let appleClickHandler;
  let store;

  beforeEach(() => {
    googleClickHandler = undefined;
    appleClickHandler = undefined;
    store = null;
    global.window = {
      location: { origin: "", href: "", hostname: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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
  });

  it("triggers Supabase OAuth sign-in for Google", async () => {
    initAuth();
    await flushPromises();

    await googleClickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: expect.any(String) },
    });
    expect(global.localStorage.getItem("smoothr_oauth")).toBe("1");
  });

  it("triggers Supabase OAuth sign-in for Apple", async () => {
    initAuth();
    await flushPromises();

    await appleClickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "apple",
      options: { redirectTo: expect.any(String) },
    });
    expect(global.localStorage.getItem("smoothr_oauth")).toBe("1");
  });
});
