import { describe, it, expect, vi, beforeEach } from "vitest";

var onAuthStateChangeHandler;
var getUserMock;
var createClientMock;
var getSessionMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  getSessionMock = vi.fn(() => Promise.resolve({ data: { session: {} }, error: null }));
  const auth = {
    getUser: getUserMock,
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(cb => {
      onAuthStateChangeHandler = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getSession: getSessionMock
  };
  const client = {
    auth,
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    }))
  };
  createClientMock = vi.fn(() => client);
  return { createClient: createClientMock };
});

import * as auth from "../../core/auth/index.js";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("auth state change", () => {
  beforeEach(() => {
    global.window = {
      location: { origin: "", href: "", hostname: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn(() => []),
      dispatchEvent: vi.fn()
    };
  });

  it("updates user and global auth on session change", async () => {
    await auth.initAuth();
    await flushPromises();
    const user = { id: "42", email: "test@example.com" };
    onAuthStateChangeHandler("SIGNED_IN", { user });
    expect(global.window.smoothr.auth.user.value).toEqual(user);
    expect(global.window.smoothr.auth.client).toBeDefined();
    await global.window.smoothr.auth.client.auth.getSession();
    expect(getSessionMock).toHaveBeenCalled();
  });
});
