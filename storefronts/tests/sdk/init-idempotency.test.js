import { describe, it, expect, vi, beforeEach } from "vitest";

var getUserMock;
var createClientMock;
var getSessionMock;

vi.mock("@supabase/supabase-js", () => {
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  getSessionMock = vi.fn(() => Promise.resolve({ data: { session: {} }, error: null }));
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: getSessionMock
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    }))
  }));
  return { createClient: createClientMock };
});

import * as auth from "../../features/auth/index.js";
import * as currency from "../../features/currency/index.js";

describe("module init idempotency", () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
    );
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
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

  it("auth.init can be called twice", async () => {
    await auth.init();
    const first = window.Smoothr.auth;
    await auth.init();
    expect(window.Smoothr.auth).toBe(first);
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it("currency.init can be called twice", async () => {
    await currency.init({ baseCurrency: "USD" });
    const first = window.Smoothr.currency.getCurrency();
    await currency.init({ baseCurrency: "USD" });
    expect(window.Smoothr.currency.getCurrency()).toBe(first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
