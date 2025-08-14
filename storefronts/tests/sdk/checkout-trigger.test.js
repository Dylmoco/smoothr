import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const checkoutInitMock = vi.fn();
const globalKey = "__supabaseAuthClientsmoothr-browser-client";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("checkout DOM trigger", () => {
  beforeEach(() => {
    vi.resetModules();
    checkoutInitMock.mockReset();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    global.console = { log: vi.fn(), warn: vi.fn() };
    vi.doMock("../../features/auth/init.js", () => ({ init: vi.fn() }));
    vi.doMock("../../features/currency/index.js", () => ({ init: vi.fn().mockResolvedValue() }));
    vi.doMock("../../features/cart/init.js", () => ({ init: vi.fn() }));
    vi.doMock("../../features/checkout/init.js", () => ({ init: checkoutInitMock }));
  });

  afterEach(() => {
    vi.doUnmock("../../features/auth/init.js");
    vi.doUnmock("../../features/currency/index.js");
    vi.doUnmock("../../features/cart/init.js");
    vi.doUnmock("../../features/checkout/init.js");
    delete globalThis[globalKey];
    vi.restoreAllMocks();
  });

  it("initializes checkout when trigger exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.Smoothr = {};
    window.smoothr = {};
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    vi.spyOn(document, 'querySelectorAll').mockReturnValue([]);
    vi.spyOn(document, 'querySelector').mockImplementation(sel => (sel === '[data-smoothr="pay"]' ? {} : null));
    vi.spyOn(document, 'getElementById').mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    expect(checkoutInitMock).toHaveBeenCalled();
  });

  it("skips checkout when trigger absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.Smoothr = {};
    window.smoothr = {};
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    vi.spyOn(document, 'querySelectorAll').mockReturnValue([]);
    vi.spyOn(document, 'querySelector').mockReturnValue(null);
    vi.spyOn(document, 'getElementById').mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    expect(checkoutInitMock).not.toHaveBeenCalled();
  });
});
