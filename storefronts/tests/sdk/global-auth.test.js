// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";

var getUserMock;
var signOutMock;
var createClientMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn();
  signOutMock = vi.fn(() => Promise.resolve({ error: null }));
  createClientMock = vi.fn(() => ({
    auth: { getUser: getUserMock, signOut: signOutMock },
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

import { initAuth } from "../../core/auth/index.js";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("global auth", () => {
  let logoutHandler;

  beforeEach(() => {
    logoutHandler = undefined;
    global.window = {
      location: { origin: "", href: "", hostname: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => cb()),
      dispatchEvent: vi.fn(),
      querySelectorAll: vi.fn((selector) => {
        if (selector === '[data-smoothr="logout"]') {
          const btn = {
            addEventListener: vi.fn((event, cb) => {
              if (event === "click") logoutHandler = cb;
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

    initAuth();
    await flushPromises();
    expect(global.window.smoothr.auth.user).toEqual(user);

    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    await logoutHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.smoothr.auth.user).toBeNull();
  });
});
