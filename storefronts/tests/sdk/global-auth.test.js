import { describe, it, expect, vi, beforeEach } from "vitest";
import { currentSupabaseMocks } from "../utils/supabase-mock";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("global auth", () => {
  let signOutHandler;

  function createTarget(triggerDom = false) {
    const listeners = {};
    return {
      addEventListener: vi.fn((evt, cb) => {
        (listeners[evt] ||= []).push(cb);
        if (triggerDom && evt === "DOMContentLoaded") cb();
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn((evt) => {
        (listeners[evt.type] || []).forEach((cb) => cb(evt));
        return true;
      }),
    };
  }

  beforeEach(() => {
    signOutHandler = undefined;
    const { getUserMock, signOutMock } = currentSupabaseMocks();
    getUserMock.mockClear();
    signOutMock.mockClear();
    getUserMock.mockResolvedValue({ data: { user: null } });
    const win = createTarget();
    win.location = { origin: "", href: "", hostname: "", assign: vi.fn() };
    global.window = win;
    global.location = win.location;
    const doc = createTarget(true);
    doc.querySelectorAll = vi.fn((selector) => {
      if (selector.includes('[data-smoothr="sign-out"]')) {
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
    });
    doc.querySelector = vi.fn(() => null);
    doc.getElementById = vi.fn(() => ({
      dataset: { storeId: 'store_test' },
      getAttribute: vi.fn(() => 'store_test')
    }));
    global.document = doc;
  });

  it("sets and clears window.Smoothr.auth.user and emits sign-out events", async () => {
    const { getUserMock } = currentSupabaseMocks();
    const user = { id: "1", email: "test@example.com" };
    getUserMock.mockResolvedValueOnce({ data: { user } });
    const auth = await import("../../features/auth/index.js");
    await auth.init();
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toEqual(user);

    const seen = [];
    window.addEventListener("smoothr:sign-out", () => seen.push("signout"));
    window.addEventListener("smoothr:auth:close", () => seen.push("close"));

    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    await signOutHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toBeNull();
    expect(seen).toContain("signout");
    expect(seen).toContain("close");
  });
});
