import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const cartInitMock = vi.fn();
const globalKey = "__supabaseAuthClientsmoothr-browser-client";

const flushPromises = () => new Promise(setImmediate);

describe("cart DOM trigger", () => {
  beforeEach(() => {
    vi.resetModules();
    cartInitMock.mockReset();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.doMock("../../features/auth/init.js", () => ({ default: vi.fn() }));
    vi.doMock("../../features/currency/index.js", () => ({ init: vi.fn().mockResolvedValue() }));
    vi.doMock("../../features/cart/index.js", () => {
      cartInitMock();
      return { __esModule: true };
    });
  });

  afterEach(() => {
    vi.doUnmock("../../features/auth/init.js");
    vi.doUnmock("../../features/currency/index.js");
    vi.doUnmock("../../features/cart/index.js");
    delete globalThis[globalKey];
    vi.restoreAllMocks();
  });

  it("imports cart when [data-smoothr=\"add-to-cart\"] is present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.Smoothr = {};
    window.smoothr = {};
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    vi.spyOn(document, 'querySelector').mockImplementation(sel => (sel === '[data-smoothr="add-to-cart"]' ? {} : null));
    vi.spyOn(document, 'getElementById').mockReturnValue(scriptEl);
    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(cartInitMock).toHaveBeenCalled();
  });

  it("skips cart when no triggers present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.Smoothr = {};
    window.smoothr = {};
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    vi.spyOn(document, 'querySelector').mockReturnValue(null);
    vi.spyOn(document, 'getElementById').mockReturnValue(scriptEl);
    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(cartInitMock).not.toHaveBeenCalled();
  });
});
