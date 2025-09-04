// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomStub } from "../utils/dom-stub";

function flushPromises() {
  return new Promise(setImmediate);
}

let realDocument;
beforeEach(() => {
  vi.resetModules();
  global.fetch = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { USD: 1, EUR: 0.8 } }),
      text: () => Promise.resolve("{}"),
    });
  global.window = {
    location: { origin: "", href: "", hostname: "" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    SMOOTHR_CONFIG: {
      baseCurrency: "EUR",
      rates: { USD: 1, EUR: 0.8 },
      rateSource: "https://example.com/api/deprecated-live-rates",
      debug: true,
    },
  };
  realDocument = global.document;
  global.document = createDomStub({
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    currentScript: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } },
  });
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
});

afterEach(() => {
  global.document = realDocument;
});

describe("SMOOTHR_CONFIG integration", () => {
  it("applies base currency and rates on load", async () => {
    const currency = await import("../../features/currency/index.js");
    await currency.init(global.window.SMOOTHR_CONFIG);
    await flushPromises();
    expect(currency.baseCurrency).toBe("EUR");
    expect(currency.rates.EUR).toBe(0.8);
    expect(global.fetch).toHaveBeenCalled();
  });
});
