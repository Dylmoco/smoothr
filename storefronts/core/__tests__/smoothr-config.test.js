// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ rates: { USD: 1, EUR: 0.8 } }),
    }),
  );
  global.window = {
    location: { origin: "", href: "", hostname: "" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    SMOOTHR_CONFIG: {
      baseCurrency: "EUR",
      rates: { USD: 1, EUR: 0.8 },
      rateSource: "https://example.com/api/live-rates",
      debug: true,
    },
  };
  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
  };
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
});

describe("SMOOTHR_CONFIG integration", () => {
  it("applies base currency and rates on load", async () => {
    const core = await import("../index.js");
    const { currency } = core;
    expect(currency.baseCurrency).toBe("EUR");
    expect(currency.rates.EUR).toBe(0.8);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api/live-rates?base=EUR&symbols=USD,EUR",
      expect.any(Object),
    );
  });
});
