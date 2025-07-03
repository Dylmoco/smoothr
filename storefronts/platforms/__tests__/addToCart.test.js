import { describe, it, expect, beforeEach, vi } from "vitest";
let initAddToCart;

class CustomEvt {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
}

describe("webflow add-to-cart binding", () => {
  let btn;
  let events;
  let addItemMock;
  let wrapper;

  beforeEach(async () => {
    vi.resetModules();
    events = {};
    btn = {
      dataset: {},
      getAttribute: vi.fn((attr) => {
        switch (attr) {
          case "data-product-id":
            return "1";
          case "data-product-name":
            return "Test";
          case "data-product-price":
            return "100";
          case "data-product-options":
            return '{"size":"L"}';
          case "data-product-subscription":
            return "true";
          default:
            return null;
        }
      }),
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "click") events.click = cb;
      }),
      closest: vi.fn(() => wrapper),
      parentElement: undefined,
    };
    const img = {
      src: "img1.jpg",
      getAttribute: vi.fn((attr) => (attr === "src" ? "img1.jpg" : null)),
    };
    wrapper = {
      querySelector: vi.fn((sel) => {
        if (sel === "img[data-smoothr-image]" || sel === "[data-smoothr-image]")
          return img;
        return null;
      }),
      dataset: {},
    };
    btn.parentElement = wrapper;
    addItemMock = vi.fn();
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn(() => [btn]),
    };
    global.window = {
      Smoothr: { cart: { addItem: addItemMock, getCart: vi.fn(() => ({})) } },
      dispatchEvent: vi.fn((ev) => {
        events[ev.type]?.(ev);
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.CustomEvent = CustomEvt;
    ({ initAddToCart } = await import("../../core/cart/addToCart.js"));
    // Override cart methods after module initializes
    global.window.Smoothr.cart.addItem = addItemMock;
    global.window.Smoothr.cart.getCart = vi.fn(() => ({}));
  });

  it("binds click handler once", () => {
    initAddToCart();
    initAddToCart();
    expect(btn.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("adds item and dispatches update", () => {
    initAddToCart();
    events.click();
    expect(addItemMock).toHaveBeenCalledWith({
      product_id: "1",
      name: "Test",
      price: 10000,
      options: { size: "L" },
      isSubscription: true,
      quantity: 1,
      image: "img1.jpg",
    });
    expect(global.window.dispatchEvent).toHaveBeenCalled();
  });

  it("finds image on ancestor when wrapper lacks one", () => {
    // wrapper lacks image; ancestor contains it
    wrapper.querySelector.mockImplementation(() => null);
    const ancestor = {
      querySelector: vi.fn(() => ({ src: "img1.jpg" })),
      parentElement: null,
    };
    wrapper.parentElement = ancestor;

    initAddToCart();
    events.click();

    expect(addItemMock).toHaveBeenCalledWith({
      product_id: "1",
      name: "Test",
      price: 10000,
      options: { size: "L" },
      isSubscription: true,
      quantity: 1,
      image: "img1.jpg",
    });
  });

  it("warns when no image is found", () => {
    console.warn = vi.fn();
    wrapper.querySelector.mockImplementation(() => null);
    wrapper.parentElement = null;

    initAddToCart();
    events.click();

    expect(addItemMock).toHaveBeenCalledWith({
      product_id: "1",
      name: "Test",
      price: 10000,
      options: { size: "L" },
      isSubscription: true,
      quantity: 1,
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("detects wrapper when button is nested deeply", () => {
    // simulate button nested inside two levels of divs within wrapper
    btn.parentElement = { matches: vi.fn(() => false), parentElement: wrapper };
    initAddToCart();
    events.click();

    expect(btn.closest).toHaveBeenCalledWith("[data-smoothr-product]");
    expect(addItemMock).toHaveBeenCalledWith({
      product_id: "1",
      name: "Test",
      price: 10000,
      options: { size: "L" },
      isSubscription: true,
      quantity: 1,
      image: "img1.jpg",
    });
  });
});
