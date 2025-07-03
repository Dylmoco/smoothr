import { describe, it, expect, beforeEach, vi } from "vitest";
import { initAddToCart } from "../../core/cart/addToCart.js";

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

  beforeEach(() => {
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
    };
    const img = {
      src: "img1.jpg",
      getAttribute: vi.fn((attr) => (attr === "src" ? "img1.jpg" : null)),
    };
    wrapper = {
      querySelector: vi.fn((sel) => {
        if (sel === "[data-smoothr-image]") return img;
        return null;
      }),
      dataset: {},
    };
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

  it("falls back to dataset image when no product image element", () => {
    // Ensure querySelector doesn't find an image element
    wrapper.querySelector.mockImplementation(() => null);
    wrapper.dataset.smoothrImage = "img1.jpg";

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

  it("uses button dataset image as a final fallback", () => {
    wrapper.querySelector.mockImplementation(() => null);
    btn.dataset.productImage = "img2.jpg";

    initAddToCart();
    events.click();

    expect(addItemMock).toHaveBeenCalledWith({
      product_id: "1",
      name: "Test",
      price: 10000,
      options: { size: "L" },
      isSubscription: true,
      quantity: 1,
      image: "img2.jpg",
    });
  });

  it("uses productImage when wrapper has no image data", () => {
    wrapper.querySelector.mockImplementation(() => null);
    // ensure wrapper.dataset.smoothrImage is undefined
    delete wrapper.dataset.smoothrImage;
    btn.dataset.productImage = "img-btn.jpg";

    initAddToCart();
    events.click();

    expect(addItemMock).toHaveBeenCalledWith({
      product_id: "1",
      name: "Test",
      price: 10000,
      options: { size: "L" },
      isSubscription: true,
      quantity: 1,
      image: "img-btn.jpg",
    });
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
