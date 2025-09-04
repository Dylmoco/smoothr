import { describe, it, expect, vi, beforeEach } from "vitest";
import { currentSupabaseMocks, createClientMock } from "../utils/supabase-mock";
import { createDomStub } from "../utils/dom-stub";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("auth state change", () => {
  let auth;

    let realDocument;
    beforeEach(async () => {
      global.window = {
        location: { origin: "", href: "", hostname: "" },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        Smoothr: {},
        smoothr: {},
        SMOOTHR_DEBUG: true
      };
      realDocument = global.document;
      global.document = createDomStub({
        addEventListener: vi.fn((evt, cb) => {
          if (evt === "DOMContentLoaded") cb();
        }),
        querySelectorAll: vi.fn(() => []),
        dispatchEvent: vi.fn()
      });
      createClientMock();
    const { getUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValue({ data: { user: null } });
    const mod = await import("../../features/auth/index.js");
    auth = mod;
    const test = global.window.Smoothr.config.__test;
    test.resetAuth();
    });

    afterEach(() => {
      global.document = realDocument;
    });

  it("updates user and global auth on session change", async () => {
    await auth.init();
    await flushPromises();
    const user = { id: "42", email: "test@example.com" };
    auth.onAuthStateChangeHandler("SIGNED_IN", { user });
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    expect(global.window.Smoothr.auth.client).toBeDefined();
    await global.window.Smoothr.auth.client.auth.getSession();
    const { getSessionMock } = currentSupabaseMocks();
    expect(getSessionMock).toHaveBeenCalled();
  });
});
