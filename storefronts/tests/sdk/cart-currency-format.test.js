import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomStub } from "../utils/dom-stub";

describe("cart totals use currency formatter", () => {
  let totalEl;
    let realDocument;
    beforeEach(() => {
      vi.resetModules();
      totalEl = { dataset: {}, setAttribute: vi.fn(), textContent: "" };
      global.console = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
      realDocument = global.document;
      global.document = createDomStub({
        querySelectorAll: vi.fn((sel) => {
          if (sel === "[data-smoothr-total]") return [totalEl];
          if (sel === "[data-smoothr-template]") return [];
          if (sel === "[data-smoothr-cart]") return [];
          if (sel === "[data-smoothr=\"remove-from-cart\"]") return [];
          return [];
        }),
      });
      global.window = {
        Smoothr: {
          cart: {
            getCart: vi.fn(() => ({ items: [] })),
            getSubtotal: vi.fn(() => 500),
          },
          currency: {
            getCurrency: vi.fn(() => "USD"),
            convertPrice: vi.fn((v) => v),
            formatPrice: vi.fn(() => "formatted"),
            baseCurrency: "USD",
          },
        },
      };
    });

    afterEach(() => {
      global.document = realDocument;
    });

  it("formats totals via Smoothr.currency.formatPrice", async () => {
    const { renderCart } = await import("../../features/cart/renderCart.js");
    renderCart();
    expect(window.Smoothr.currency.formatPrice).toHaveBeenCalledWith(5, "USD");
    expect(totalEl.textContent).toBe("formatted");
  });
});
