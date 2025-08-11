import { describe, it, expect, vi, beforeEach } from "vitest";

var getUserMock;
var createClientMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn();
  createClientMock = vi.fn(() => ({
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
  beforeEach(() => {
    clickHandler = undefined;
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
    global.document = {
      currentScript: null,
      getElementById: vi.fn(() => scriptEl),
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
        if (evt === "click") clickHandler = cb;
      }),
      querySelectorAll: vi.fn((selector) => {
        if (selector === '[data-smoothr="login"]') return [];
        if (
          selector ===
          '[data-smoothr="signup"], [data-smoothr="login-google"], [data-smoothr="login-apple"], [data-smoothr="password-reset"]'
        )
          return [];
        if (selector === 'form[data-smoothr="auth-form"]') return [];
        if (selector === '[data-smoothr="sign-out"]') return [];
        return [];
      }),
      querySelector: vi.fn(() => null),
      dispatchEvent: vi.fn(),
    };
  });

  describe("redirects logged-in users to dashboard home", () => {
    let user;

    beforeEach(async () => {
      vi.resetModules();
      authHelpers = await import("../../features/auth/authHelpers.js");
      vi
        .spyOn(authHelpers, "lookupDashboardHomeUrl")
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
      expect(authHelpers.lookupDashboardHomeUrl).toHaveBeenCalled();
      expect(global.window.location.href).toBe("/dashboard");
    });
  });

  describe("dispatches open-auth event for anonymous users", () => {
    beforeEach(async () => {
      vi.resetModules();
      getUserMock.mockResolvedValueOnce({ data: { user: null } });
      authHelpers = await import("../../features/auth/authHelpers.js");
      const { init } = await import("../../features/auth/index.js");
      await init({});
      await flushPromises();
    });

    it("dispatches open-auth event for anonymous users", async () => {
      await clickHandler({ target: btn, preventDefault: () => {} });
      await flushPromises();

      expect(global.window.dispatchEvent).toHaveBeenCalled();
      const evt = global.window.dispatchEvent.mock.calls[0][0];
      expect(evt.type).toBe("smoothr:open-auth");
      expect(evt.detail.targetSelector).toBe('[data-smoothr="auth-wrapper"]');
    });
  });
});

