import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

const globalKey = "__supabaseAuthClientsmoothr-browser-client";

describe("cart DOM trigger", () => {
  beforeEach(() => {
    vi.resetModules();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
          text: () => Promise.resolve('')
        })
      );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mock("../../features/auth/init.js", () => ({ __esModule: true, default: vi.fn() }));
    vi.mock("../../features/currency/index.js", () => ({ __esModule: true, init: vi.fn().mockResolvedValue() }));
  });

  afterEach(() => {
    vi.unmock("../../features/auth/init.js");
    vi.unmock("../../features/currency/index.js");
    delete globalThis[globalKey];
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

    it("imports cart when [data-smoothr=\"add-to-cart\"] is present", async () => {
      const scriptEl = document.createElement('script');
      scriptEl.dataset.storeId = '1';
      scriptEl.id = 'smoothr-sdk';
      document.body.appendChild(scriptEl);
      Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
      window.addEventListener = vi.fn();
      window.removeEventListener = vi.fn();
    window.Smoothr = { ready: Promise.resolve(), config: {} };
    window.smoothr = window.Smoothr;
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
      const trigger = document.createElement('button');
      trigger.setAttribute('data-smoothr', 'add-to-cart');
      document.body.appendChild(trigger);
      await import("../../smoothr-sdk.js");
      await window.Smoothr.ready;
      await Promise.resolve();
      expect(window.Smoothr.cart).toBeDefined();
    });

    it("skips cart when no triggers present", async () => {
      const scriptEl = document.createElement('script');
      scriptEl.dataset.storeId = '1';
      scriptEl.id = 'smoothr-sdk';
      document.body.appendChild(scriptEl);
      Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
      window.addEventListener = vi.fn();
      window.removeEventListener = vi.fn();
      window.Smoothr = { ready: Promise.resolve(), config: {} };
      window.smoothr = window.Smoothr;
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
      await import("../../smoothr-sdk.js");
      await window.Smoothr.ready;
      await Promise.resolve();
      expect(window.Smoothr.cart).toBeUndefined();
    });
});
