import { describe, it, expect, beforeEach, vi } from "vitest";

let store;
let events;

beforeEach(() => {
  vi.resetModules();
  store = {};
  events = [];
  global.localStorage = {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => {
      store[key] = val;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
  };
  global.window = {
    dispatchEvent: vi.fn((ev) => events.push(ev)),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    location: { origin: "", href: "", hostname: "" },
  };
  global.document = {};
});

describe("cart module", () => {
  it("adds items and increments quantity", async () => {
    const cart = await import("../cart.js");
    cart.addItem({ product_id: "1", name: "Test", price: 100, quantity: 1 });
    cart.addItem({ product_id: "1", name: "Test", price: 100, quantity: 1 });
    const stored = JSON.parse(store["smoothr_cart"]);
    expect(stored.items[0].quantity).toBe(2);
    expect(events.length).toBe(2);
  });

  it("updates quantity and calculates totals with discount", async () => {
    const cart = await import("../cart.js");
    cart.addItem({ product_id: "1", name: "A", price: 100, quantity: 2 });
    cart.updateQuantity("1", 3);
    cart.applyDiscount({ code: "SAVE", type: "percent", amount: 50 });
    expect(cart.getSubtotal()).toBe(300);
    expect(cart.getTotal()).toBe(150);
  });

  it("clears cart", async () => {
    const cart = await import("../cart.js");
    cart.addItem({ product_id: "1", name: "A", price: 100, quantity: 1 });
    cart.clearCart();
    expect(cart.getCart().items.length).toBe(0);
  });
});
