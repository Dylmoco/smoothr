import { describe, it, expect, vi, beforeEach } from "vitest";

var getUserMock;
var createClientMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn();
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: vi.fn(),
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

import * as auth from "../../core/auth/index.js";

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
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
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
      }),
      querySelectorAll: vi.fn((selector) => {
        if (selector === '[data-smoothr="account-access"]') return [btn];
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

  it("redirects logged-in users to dashboard home", async () => {
    const user = { id: "1", email: "test@example.com" };
    getUserMock.mockResolvedValueOnce({ data: { user } });

    await auth.initAuth();
    await flushPromises();
    expect(global.window.smoothr.auth.user.value).toEqual(user);

    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(authHelpers.lookupDashboardHomeUrl).toHaveBeenCalled();
    expect(global.window.location.href).toBe("/dashboard");
  });

  it("dispatches open-auth event for anonymous users", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    await auth.initAuth();
    await flushPromises();

    await clickHandler({ preventDefault: () => {} });
    await flushPromises();

    expect(global.window.dispatchEvent).toHaveBeenCalled();
    const evt = global.window.dispatchEvent.mock.calls[0][0];
    expect(evt.type).toBe("smoothr:open-auth");
    expect(evt.detail.targetSelector).toBe('[data-smoothr="auth-wrapper"]');
  });
});

