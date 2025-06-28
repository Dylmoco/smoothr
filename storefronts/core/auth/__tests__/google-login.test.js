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

import { initAuth } from "../index.js";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("google login button", () => {
  let clickHandler;
  let store;

  beforeEach(() => {
    clickHandler = undefined;
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
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((selector) => {
        if (selector.includes('[data-smoothr="login-google"]')) {
          const btn = {
            dataset: { smoothr: "login-google" },
            getAttribute: (attr) =>
              attr === "data-smoothr" ? "login-google" : null,
            addEventListener: vi.fn((ev, cb) => {
              if (ev === "click") clickHandler = cb;
            }),
            closest: vi.fn(() => null),
          };
          return [btn];
        }
        return [];
      }),
    };
  });

  it("triggers Supabase OAuth sign-in", async () => {
    initAuth();
    await flushPromises();

    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "" },
    });
    expect(global.localStorage.getItem("smoothr_oauth")).toBe("1");
  });
});
