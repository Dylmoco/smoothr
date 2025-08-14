// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../features/auth/init.js", () => ({
  init: vi.fn(),
}));
vi.mock("../../features/currency/index.js", () => ({
  init: vi.fn(),
}));

describe("platform detection", () => {
  let scriptEl;

  beforeEach(() => {
    vi.resetModules();
    scriptEl = null;

    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.Smoothr = { config: {} };
    window.smoothr = {};
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    vi.spyOn(document, 'querySelectorAll').mockReturnValue([]);
    vi.spyOn(document, 'querySelector').mockReturnValue(null);
    vi.spyOn(document, 'getElementById').mockImplementation(() => scriptEl);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function flushPromises() {
    return new Promise(setImmediate);
  }

  it("uses data-platform attribute", async () => {
    scriptEl = {
      dataset: { storeId: "1", platform: "webflow" },
      getAttribute: vi.fn(() => null),
    };
    global.document.getElementById.mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(global.window.Smoothr.config.platform).toBe("webflow");
  });

  it("uses platform attribute when data-platform missing", async () => {
    scriptEl = {
      dataset: { storeId: "1" },
      getAttribute: vi.fn((name) => (name === "platform" ? "magento" : null)),
    };
    global.document.getElementById.mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(global.window.Smoothr.config.platform).toBe("magento");
  });

  it("prefers data-platform over platform attribute", async () => {
    scriptEl = {
      dataset: { storeId: "1", platform: "webflow" },
      getAttribute: vi.fn((name) => (name === "platform" ? "magento" : null)),
    };
    global.document.getElementById.mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(global.window.Smoothr.config.platform).toBe("webflow");
  });
});
