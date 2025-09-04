import { describe, it, expect, vi, beforeEach } from "vitest";
import { currentSupabaseMocks } from "../utils/supabase-mock";
import * as auth from "../../features/auth/index.js";
import * as currency from "../../features/currency/index.js";

describe("module init idempotency", () => {
  beforeEach(() => {
    vi.resetModules();
    const { getUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValue({ data: { user: null } });
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
    const { getUserMock } = currentSupabaseMocks();
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
