import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

vi.mock('storefronts/features/auth/init.js', () => ({ default: vi.fn() }));
vi.mock('storefronts/features/currency/index.js', () => ({ init: vi.fn() }));
vi.mock('storefronts/features/cart/index.js', () => ({ __esModule: true }));
vi.mock('storefronts/features/checkout/init.js', () => ({ __esModule: true }));

describe("platform detection", () => {
  let scriptEl;

  beforeEach(() => {
    vi.resetModules();
    scriptEl = null;
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );
    Object.defineProperty(window, "location", { value: { search: "" }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
    vi.spyOn(document, "querySelectorAll").mockReturnValue([]);
    vi.spyOn(document, "querySelector").mockReturnValue(null);
    vi.spyOn(document, "getElementById").mockImplementation(() => scriptEl);
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true });
  });

  afterEach(() => {
    delete window.Smoothr;
    vi.restoreAllMocks();
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true });
  });

  it("uses existing Smoothr.config.platform for webflow", async () => {
    scriptEl = { dataset: { storeId: "1" }, getAttribute: vi.fn(), src: 'https://example.com/smoothr-sdk.mjs' };
    global.document.getElementById.mockReturnValue(scriptEl);
    Object.defineProperty(document, 'currentScript', { value: scriptEl, configurable: true });
    window.Smoothr = { config: { platform: "webflow" } };
    window.smoothr = {};

    await import("../../smoothr-sdk.mjs");
    await window.Smoothr.ready;
    expect(window.Smoothr.config.platform).toBe("webflow");
  });

  it("uses existing Smoothr.config.platform for magento", async () => {
    scriptEl = { dataset: { storeId: "1" }, getAttribute: vi.fn(), src: 'https://example.com/smoothr-sdk.mjs' };
    global.document.getElementById.mockReturnValue(scriptEl);
    Object.defineProperty(document, 'currentScript', { value: scriptEl, configurable: true });
    window.Smoothr = { config: { platform: "magento" } };
    window.smoothr = {};

    await import("../../smoothr-sdk.mjs");
    await window.Smoothr.ready;
    expect(window.Smoothr.config.platform).toBe("magento");
  });
});
