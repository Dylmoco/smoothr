import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../features/auth/index.js", () => {
  const authMock = {
    init: vi.fn().mockResolvedValue(),
    lookupRedirectUrl: vi.fn(),
    lookupDashboardHomeUrl: vi.fn(),
  };
  return { default: authMock, ...authMock };
});

import * as auth from "../../features/auth/index.js";

let store;
let events;

beforeEach(async () => {
  vi.resetModules();
  store = {};
  events = [];
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  );
  global.localStorage = {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, val) => {
      store[key] = val;
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    })
  };
  globalThis.il = global.localStorage;
  global.window = {
    dispatchEvent: vi.fn((ev) => events.push(ev)),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    location: { origin: "", href: "", hostname: "" },
    Smoothr: {},
  };
  global.document = {
    addEventListener: vi.fn((evt, cb) => {
      if (evt === "DOMContentLoaded") cb();
    }),
    querySelectorAll: vi.fn((sel) => {
      if (sel === "[data-smoothr]") {
        return [
          {
            getAttribute: () => "cart",
            dataset: { smoothr: "cart" },
          },
        ];
      }
      return [];
    }),
    dispatchEvent: vi.fn(),
    currentScript: {
      dataset: { storeId: "00000000-0000-0000-0000-000000000000" },
    },
    getElementById: vi.fn(() => ({
      dataset: { storeId: "00000000-0000-0000-0000-000000000000" },
    })),
  };
  store["smoothr_cart"] = JSON.stringify({ items: [], meta: { lastModified: Date.now() } });
  await import("../../features/auth/init.js");
  await auth.init({
    storeId: "00000000-0000-0000-0000-000000000000",
    baseCurrency: "USD",
  });
  const cart = await import("../../features/cart/index.js");
  global.window.Smoothr.cart = cart;
});

describe("cart module", () => {
  it("adds items and increments quantity", () => {
    const { cart } = window.Smoothr;
    cart.addItem({ product_id: "1", name: "Test", price: 100, quantity: 1 });
    cart.addItem({ product_id: "1", name: "Test", price: 100, quantity: 1 });
    const stored = JSON.parse(store["smoothr_cart"]);
    expect(stored.items[0].quantity).toBe(2);
    expect(cart.getSubtotal()).toBe(200);
    expect(stored.meta).toHaveProperty("lastModified");
    expect(events.length).toBe(2);
  });

  it("persists product_id in storage", () => {
    const { cart } = window.Smoothr;
    cart.addItem({ product_id: "7", name: "Widget", price: 200, quantity: 1 });
    const stored = JSON.parse(store["smoothr_cart"]);
    expect(stored.items[0].product_id).toBe("7");
    expect(cart.getCart().items[0].product_id).toBe("7");
  });

  it("updates quantity and calculates totals with discount", () => {
    const { cart } = window.Smoothr;
    cart.addItem({ product_id: "1", name: "A", price: 100, quantity: 2 });
    cart.updateQuantity("1", 3);
    cart.applyDiscount({ code: "SAVE", type: "percent", amount: 50 });
    expect(cart.getSubtotal()).toBe(300);
    const subtotal = cart.getSubtotal();
    const discount = cart.getDiscount();
    const total = discount
      ? Math.max(
          0,
          discount.type === "percent"
            ? subtotal - Math.round(subtotal * (discount.amount / 100))
            : subtotal - discount.amount
        )
      : subtotal;
    expect(total).toBe(150);
  });

  it("clears cart", () => {
    const { cart } = window.Smoothr;
    cart.addItem({ product_id: "1", name: "A", price: 100, quantity: 1 });
    cart.clearCart();
    expect(cart.getCart().items.length).toBe(0);
    const stored = JSON.parse(store["smoothr_cart"]);
    expect(stored).toEqual({ items: [], meta: { lastModified: expect.any(Number) } });
  });
});
