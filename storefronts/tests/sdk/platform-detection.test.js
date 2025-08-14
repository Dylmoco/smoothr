import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../features/auth/init.js", () => ({ default: vi.fn() }));
vi.mock("../../features/currency/index.js", () => ({ init: vi.fn() }));
vi.mock("../../features/cart/index.js", () => ({ __esModule: true }));
vi.mock("../../features/checkout/init.js", () => ({ __esModule: true }));

describe("platform detection", () => {
  let scriptEl;

  beforeEach(() => {
    vi.resetModules();
    scriptEl = null;
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })
    );
    Object.defineProperty(window, "location", { value: { search: "" }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
    vi.spyOn(document, "querySelectorAll").mockReturnValue([]);
    vi.spyOn(document, "querySelector").mockReturnValue(null);
    vi.spyOn(document, "getElementById").mockImplementation(() => scriptEl);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const flushPromises = () => new Promise(setImmediate);

  it("uses existing Smoothr.config.platform for webflow", async () => {
    scriptEl = { dataset: { storeId: "1" }, getAttribute: vi.fn() };
    global.document.getElementById.mockReturnValue(scriptEl);
    window.Smoothr = { config: { platform: "webflow" } };
    window.smoothr = {};

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(window.Smoothr.config.platform).toBe("webflow");
  });

  it("uses existing Smoothr.config.platform for magento", async () => {
    scriptEl = { dataset: { storeId: "1" }, getAttribute: vi.fn() };
    global.document.getElementById.mockReturnValue(scriptEl);
    window.Smoothr = { config: { platform: "magento" } };
    window.smoothr = {};

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(window.Smoothr.config.platform).toBe("magento");
  });
});
