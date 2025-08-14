// vitest globals are available
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("checkout DOM trigger", () => {
  beforeEach(() => {
    vi.resetModules();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
          text: () => Promise.resolve('')
        })
      );
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mock("../../features/auth/init.js", () => ({ __esModule: true, default: vi.fn() }));
      vi.mock("../../features/currency/index.js", () => ({ __esModule: true, init: vi.fn().mockResolvedValue() }));
      vi.mock("../../features/cart/index.js", () => ({ __esModule: true }));
    window.Smoothr = { ready: Promise.resolve(), config: {} };
    window.smoothr = window.Smoothr;
  });

  afterEach(() => {
    vi.unmock("../../features/auth/init.js");
    vi.unmock("../../features/currency/index.js");
    vi.unmock("../../features/cart/index.js");
    vi.unmock("../../features/checkout/init.js");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

    it("initializes checkout when trigger exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
      const trigger = document.createElement('button');
      trigger.setAttribute('data-smoothr', 'pay');
      document.body.appendChild(trigger);

      await import("../../smoothr-sdk.js");
      await window.Smoothr.ready;
      await Promise.resolve();
      expect(window.Smoothr.checkout).toBeDefined();
  });

    it("skips checkout when trigger absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

      await import("../../smoothr-sdk.js");
      await window.Smoothr.ready;
      await Promise.resolve();
      expect(window.Smoothr.checkout).toBeUndefined();
  });
});
