import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

describe("cart feature loading", () => {
  beforeEach(() => {
    vi.resetModules();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
          text: () => Promise.resolve('')
        })
      );
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.mock("../../features/auth/init.js", () => ({ __esModule: true, default: vi.fn() }));
      vi.mock("../../features/currency/index.js", () => ({ __esModule: true, init: vi.fn().mockResolvedValue() }));
  });

  afterEach(() => {
    vi.unmock("../../features/auth/init.js");
    vi.unmock("../../features/currency/index.js");
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

    it("initializes cart when [data-smoothr-total] exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '' }, configurable: true });
    window.Smoothr = { ready: Promise.resolve(), config: {} };
    window.smoothr = window.Smoothr;
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
      const totalEl = document.createElement('div');
      totalEl.setAttribute('data-smoothr-total', '');
      document.body.appendChild(totalEl);

      await import("../../smoothr-sdk.js");
      await window.Smoothr.ready;
      await Promise.resolve();
      expect(window.Smoothr.cart).toBeDefined();
  });

    it("logs when cart triggers are absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    Object.defineProperty(window, 'location', { value: { search: '?smoothr-debug=true' }, configurable: true });
    window.Smoothr = { ready: Promise.resolve(), config: {} };
    window.smoothr = window.Smoothr;
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

      await import("../../smoothr-sdk.js");
      await window.Smoothr.ready;
      await Promise.resolve();
      expect(window.Smoothr.cart).toBeUndefined();
      expect(logSpy.mock.calls).toContainEqual([
        "[Smoothr SDK]",
        "No cart triggers found, skipping cart initialization",
      ]);
  });
});

