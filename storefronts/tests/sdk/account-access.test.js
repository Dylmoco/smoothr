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

import * as authHelpers from "../../../supabase/authHelpers.js";
vi.spyOn(authHelpers, "lookupDashboardHomeUrl").mockResolvedValue("/dashboard");

let auth;

function flushPromises() {
  return new Promise(setImmediate);
}

describe("account access trigger", () => {
  let btn;
  let clickHandler;

  beforeEach(async () => {
    vi.resetModules();
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
    global.document = {
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
    auth = await import("../../features/auth/index.js");
  });

  it("redirects logged-in users to dashboard home", async () => {
    const user = { id: "1", email: "test@example.com" };
    getUserMock.mockResolvedValueOnce({ data: { user } });

    await auth.init();
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toEqual(user);

    await clickHandler({ target: btn, preventDefault: () => {} });
    await flushPromises();
    expect(authHelpers.lookupDashboardHomeUrl).toHaveBeenCalled();
    expect(global.window.location.href).toBe("/dashboard");
  });

  it("dispatches open-auth event for anonymous users", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    await auth.init();
    await flushPromises();

    await clickHandler({ target: btn, preventDefault: () => {} });
    await flushPromises();

    expect(global.window.dispatchEvent).toHaveBeenCalled();
    const evt = global.window.dispatchEvent.mock.calls[0][0];
    expect(evt.type).toBe("smoothr:open-auth");
    expect(evt.detail.targetSelector).toBe('[data-smoothr="auth-wrapper"]');
  });
});

