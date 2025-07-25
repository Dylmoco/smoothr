// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../core/currency/index.js", async () => {
  const actual = await vi.importActual("../../core/currency/index.js");
  return { ...actual, baseCurrency: "USD" };
});

beforeEach(() => {
  vi.resetModules();
  global.window = {
    location: { origin: "", href: "", hostname: "" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  global.window.SMOOTHR_CONFIG = { baseCurrency: "USD" };
  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    currentScript: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } },
  };
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
});

describe("global currency helper", () => {
  it("attaches setSelectedCurrency to globalThis", async () => {
    await import("../../core/index.js");
    expect(typeof globalThis.setSelectedCurrency).toBe("function");
  });
});
