import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

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
    vi.mock("storefronts/features/auth/init.js", () => ({ default: vi.fn() }));
    vi.mock("storefronts/features/currency/index.js", () => ({ init: vi.fn().mockResolvedValue() }));
    vi.mock("storefronts/features/cart/index.js", () => {
      cartInitMock();
      return { __esModule: true };
    });
  });

  afterEach(() => {
    vi.unmock("storefronts/features/auth/init.js");
    vi.unmock("storefronts/features/currency/index.js");
    vi.unmock("storefronts/features/cart/index.js");
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it.skip("initializes cart when [data-smoothr-total] exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.Smoothr = { config: {} };
    window.smoothr = window.Smoothr;
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    const totalEl = document.createElement('div');
    totalEl.setAttribute('data-smoothr-total', '');
    document.body.appendChild(totalEl);

    await import("../../smoothr-sdk.js");
    for (let i = 0; i < 8; i++) await flushPromises();
    expect(cartInitMock).toHaveBeenCalled();
  });

  it.skip("logs when cart triggers are absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '?smoothr-debug=true' }, configurable: true });
    window.Smoothr = { config: {} };
    window.smoothr = window.Smoothr;
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

    await import("../../smoothr-sdk.js");
    for (let i = 0; i < 8; i++) await flushPromises();
    expect(cartInitMock).not.toHaveBeenCalled();
    expect(logSpy.mock.calls).toContainEqual([
      "[Smoothr SDK]",
      "No cart triggers found, skipping cart initialization",
    ]);
  });
});

