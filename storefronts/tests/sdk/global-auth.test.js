// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";

var getUserMock;
var signOutMock;
var createClientMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn();
  signOutMock = vi.fn(() => Promise.resolve({ error: null }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signOut: signOutMock, onAuthStateChange: vi.fn() },
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

import { auth } from "../../adapters/core/sdk-auth-entry.js";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("global auth", () => {
  let signOutHandler;

  beforeEach(() => {
    signOutHandler = undefined;
    global.window = {
      location: { origin: "", href: "", hostname: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      dispatchEvent: vi.fn(),
      querySelectorAll: vi.fn((selector) => {
        if (selector === '[data-smoothr="sign-out"]') {
          const btn = {
            tagName: "DIV",
            dataset: { smoothr: "sign-out" },
            addEventListener: vi.fn((event, cb) => {
              if (event === "click") signOutHandler = cb;
            }),
          };
          return [btn];
        }
        return [];
      }),
    };
  });

  it("sets and clears window.smoothr.auth.user", async () => {
    const user = { id: "1", email: "test@example.com" };
    getUserMock.mockResolvedValueOnce({ data: { user } });

    auth.initAuth();
    await flushPromises();
    expect(global.window.smoothr.auth.user.value).toEqual(user);

    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    await signOutHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.smoothr.auth.user.value).toBeNull();
  });
});
