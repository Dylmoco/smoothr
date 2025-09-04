// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomStub } from "../utils/dom-stub";

vi.mock("../../features/currency/index.js", async () => {
  const actual = await vi.importActual("../../features/currency/index.js");
  return { ...actual, baseCurrency: "USD" };
});

let realDocument;
beforeEach(() => {
  vi.resetModules();
  global.window = {
    location: { origin: "", href: "", hostname: "" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  global.window.SMOOTHR_CONFIG = { baseCurrency: "USD" };
  realDocument = global.document;
  global.document = createDomStub({
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
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

describe("global currency helper", () => {
  it("attaches setSelectedCurrency to globalThis", async () => {
    await import("../../features/auth/init.js");
    expect(typeof globalThis.setSelectedCurrency).toBe("function");
  });
});
