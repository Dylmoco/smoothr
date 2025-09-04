import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createClientMock as createClientMockUtil,
  currentSupabaseMocks,
} from "../utils/supabase-mock";
import { createDomStub } from "../utils/dom-stub";

var getUserMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn();
  const createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
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

let authHelpers;

function flushPromises() {
  return new Promise(setImmediate);
}

describe("account access trigger", () => {
  let btn;
  let clickHandler;
  let realWindow;
  let realDocument;
    beforeEach(() => {
      clickHandler = undefined;
      realWindow = global.window;
      realDocument = global.document;
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "account-access" },
      closest: vi.fn(() => btn),
    };

    global.window = {
      location: { href: "", origin: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const scriptEl = {
      dataset: { storeId: "1" },
      getAttribute: vi.fn(() => "1"),
    };
      global.document = createDomStub({
        currentScript: null,
        getElementById: vi.fn(() => scriptEl),
        addEventListener: vi.fn((evt, cb) => {
          if (evt === "DOMContentLoaded") cb();
          if (evt === "click") clickHandler = cb;
        }),
        querySelectorAll: vi.fn(() => []),
        querySelector: vi.fn((sel) => {
          if (sel === '[data-smoothr="auth-pop-up"]') return {};
          return null;
        }),
        dispatchEvent: vi.fn(),
      });
  });

  afterEach(() => {
    global.window = realWindow;
    global.document = realDocument;
  });

  describe("redirects logged-in users to dashboard home", () => {
    let user;

    beforeEach(async () => {
      vi.resetModules();
      createClientMockUtil();
      const { getUserMock } = currentSupabaseMocks();
      authHelpers = await import("../../../supabase/authHelpers.js");
      vi
        .spyOn(authHelpers, "lookupRedirectUrl")
        .mockResolvedValue("/dashboard");
      user = { id: "1", email: "test@example.com" };
      getUserMock.mockResolvedValueOnce({ data: { user } });
      const { init } = await import("../../features/auth/index.js");
      await init({});
      await flushPromises();
    });

    it("redirects logged-in users to dashboard home", async () => {
      expect(global.window.Smoothr.auth.user.value).toEqual(user);

      await clickHandler({ target: btn, preventDefault: () => {} });
      await flushPromises();
      expect(authHelpers.lookupRedirectUrl).toHaveBeenCalled();
      expect(global.window.location.href).toBe("/dashboard");
    });
  });

  describe("dispatches auth:open event for anonymous users", () => {
    beforeEach(async () => {
      vi.resetModules();
      createClientMockUtil();
      const { getUserMock } = currentSupabaseMocks();
      getUserMock.mockResolvedValueOnce({ data: { user: null } });
      authHelpers = await import("../../../supabase/authHelpers.js");
      const { init } = await import("../../features/auth/index.js");
      await init({});
      await flushPromises();
    });

    it("dispatches auth:open event for anonymous users", async () => {
      await clickHandler({ target: btn, preventDefault: () => {} });
      await flushPromises();

      expect(global.document.dispatchEvent).toHaveBeenCalledTimes(1);
      expect(global.window.dispatchEvent).toHaveBeenCalledTimes(1);
      const docEvt = global.document.dispatchEvent.mock.calls[0][0];
      const winEvt = global.window.dispatchEvent.mock.calls[0][0];
      expect(docEvt.type).toBe("smoothr:auth:open");
      expect(winEvt.type).toBe("smoothr:auth:open");
      expect(docEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
      expect(winEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
    });
  });

  it("dispatches auth:close on sign-out", async () => {
    vi.resetModules();
    createClientMockUtil();
    const { getUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const auth = await import("../../features/auth/index.js");
    await auth.init({});
    await flushPromises();

    const listeners = {};
    window.location.assign = vi.fn();
    window.addEventListener.mockImplementation((evt, cb) => {
      (listeners[evt] ||= []).push(cb);
    });
    window.dispatchEvent.mockImplementation((evt) => {
      (listeners[evt.type] || []).forEach((cb) => cb(evt));
      return true;
    });

    const closed = [];
    window.addEventListener("smoothr:auth:close", () => closed.push(true));
    await auth.signOutHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(closed.length).toBeGreaterThan(0);
  });
});

