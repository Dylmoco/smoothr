import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

const cartInitMock = vi.fn();

describe("cart feature loading", () => {
  beforeEach(() => {
    vi.resetModules();
      cartInitMock.mockReset();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
          text: () => Promise.resolve('')
        })
      );
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.mock("storefronts/features/auth/init.js", () => ({ __esModule: true, default: vi.fn() }));
      vi.mock("storefronts/features/currency/index.js", () => ({ __esModule: true, init: vi.fn().mockResolvedValue() }));
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

    it("initializes cart when [data-smoothr-total] exists", async () => {
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
      await window.Smoothr.ready;
      expect(cartInitMock).toHaveBeenCalled();
  });

    it("logs when cart triggers are absent", async () => {
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
      await window.Smoothr.ready;
      expect(cartInitMock).not.toHaveBeenCalled();
      expect(logSpy.mock.calls).toContainEqual([
        "[Smoothr SDK]",
        "No cart triggers found, skipping cart initialization",
      ]);
  });
});

