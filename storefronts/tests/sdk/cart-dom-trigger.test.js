import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

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
    delete globalThis[globalKey];
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it.skip("imports cart when [data-smoothr=\"add-to-cart\"] is present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.Smoothr = {};
    window.smoothr = {};
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    const trigger = document.createElement('button');
    trigger.setAttribute('data-smoothr', 'add-to-cart');
    document.body.appendChild(trigger);
    await import("../../smoothr-sdk.js");
    for (let i = 0; i < 8; i++) await flushPromises();
    expect(cartInitMock).toHaveBeenCalled();
  });

  it.skip("skips cart when no triggers present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
    window.Smoothr = {};
    window.smoothr = {};
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    await import("../../smoothr-sdk.js");
    for (let i = 0; i < 8; i++) await flushPromises();
    expect(cartInitMock).not.toHaveBeenCalled();
  });
});
