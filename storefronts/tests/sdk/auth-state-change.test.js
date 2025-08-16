import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "../../features/auth/index.js";
import { onAuthStateChangeHandler } from "../../features/auth/index.js";
import { currentSupabaseMocks } from "../utils/supabase-mock";
import { __test_resetAuth } from "../../features/auth/init.js";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("auth state change", () => {
  beforeEach(() => {
    __test_resetAuth();
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
    const { getUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValue({ data: { user: null } });
  });

  it("updates user and global auth on session change", async () => {
    await auth.init();
    await flushPromises();
    const user = { id: "42", email: "test@example.com" };
    // Use the exported live binding (set inside init())
    onAuthStateChangeHandler("SIGNED_IN", { user });
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    expect(global.window.Smoothr.auth.client).toBeDefined();
    await global.window.Smoothr.auth.client.auth.getSession();
    const { getSessionMock } = currentSupabaseMocks();
    expect(getSessionMock).toHaveBeenCalled();
  });
});
