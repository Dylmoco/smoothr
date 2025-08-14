import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const cartInitMock = vi.fn();

const flushPromises = () => new Promise(setImmediate);

describe("cart feature loading", () => {
  beforeEach(() => {
    vi.resetModules();
    cartInitMock.mockReset();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })
    );
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
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it("initializes cart when [data-smoothr-total] exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.Smoothr = { config: {} };
    window.smoothr = window.Smoothr;
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    const totalEl = document.createElement('div');
    totalEl.setAttribute('data-smoothr-total', '');
    document.body.appendChild(totalEl);

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(cartInitMock).toHaveBeenCalled();
  });

  it("logs when cart triggers are absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    Object.defineProperty(window, 'location', { value: { search: '?smoothr-debug=true' }, configurable: true });
    window.Smoothr = { config: {} };
    window.smoothr = window.Smoothr;
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);

    await import("../../smoothr-sdk.js");
    await flushPromises();
    await flushPromises();
    await flushPromises();
    await flushPromises();
    expect(cartInitMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "[Smoothr SDK]",
      "No cart triggers found, skipping cart initialization"
    );
  });
});

