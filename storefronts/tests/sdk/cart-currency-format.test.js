import { describe, it, expect, beforeEach, vi } from "vitest";

describe("cart totals use currency formatter", () => {
  let totalEl;
  beforeEach(() => {
    vi.resetModules();
    totalEl = { dataset: {}, setAttribute: vi.fn(), textContent: "" };
    global.console = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
    global.document = {
      querySelectorAll: vi.fn((sel) => {
        if (sel === "[data-smoothr-total]") return [totalEl];
        if (sel === "[data-smoothr-template]") return [];
        if (sel === "[data-smoothr-cart]") return [];
        if (sel === "[data-smoothr=\"remove-from-cart\"]") return [];
        return [];
      }),
    };
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

  it("formats totals via Smoothr.currency.formatPrice", async () => {
    const { renderCart } = await import("../../features/cart/renderCart.js");
    renderCart();
    expect(window.Smoothr.currency.formatPrice).toHaveBeenCalledWith(5, "USD");
    expect(totalEl.textContent).toBe("formatted");
  });
});
