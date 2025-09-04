import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomStub } from "../utils/dom-stub";
let bindAddToCartButtons;

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

    let realDocument;
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
    addItemMock = vi.fn(() => {
      global.window.dispatchEvent(new CustomEvt('smoothr:cart:updated'));
    });
      realDocument = global.document;
      global.document = createDomStub({
        querySelectorAll: vi.fn(() => [btn]),
      });
    global.window = {
      Smoothr: { cart: { addItem: addItemMock, getCart: vi.fn(() => ({ items: [] })) } },
      dispatchEvent: vi.fn((ev) => {
        events[ev.type]?.(ev);
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { pathname: "" },
    };
    global.window.SMOOTHR_CONFIG = { debug: true };
    global.CustomEvent = CustomEvt;
    ({ bindAddToCartButtons } = await import("../../features/cart/addToCart.js"));
    // Override cart methods after module initializes
    global.window.Smoothr.cart.addItem = addItemMock;
    global.window.Smoothr.cart.getCart = vi.fn(() => ({ items: [] }));
  });

  it("binds click handler once", async () => {
    await bindAddToCartButtons();
    await bindAddToCartButtons();
    expect(btn.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("adds item and dispatches update", async () => {
    await bindAddToCartButtons();
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

    afterEach(() => {
      global.document = realDocument;
    });
    expect(global.window.dispatchEvent).toHaveBeenCalled();
  });

  it("finds image on ancestor when wrapper lacks one", async () => {
    // wrapper lacks image; ancestor contains it
    wrapper.querySelector.mockImplementation(() => null);
    const ancestor = {
      querySelector: vi.fn(() => ({ src: "img1.jpg" })),
      parentElement: null,
    };
    wrapper.parentElement = ancestor;

    await bindAddToCartButtons();
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

  it("warns when no image is found", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    wrapper.querySelector.mockImplementation(() => null);
    wrapper.parentElement = null;

    await bindAddToCartButtons();
    events.click();

    expect(addItemMock).toHaveBeenCalledWith({
      product_id: "1",
      name: "Test",
      price: 10000,
      options: { size: "L" },
      isSubscription: true,
      quantity: 1,
      image: ""
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("detects wrapper when button is nested deeply", async () => {
    // simulate button nested inside two levels of divs within wrapper
    btn.parentElement = { matches: vi.fn(() => false), parentElement: wrapper };
    await bindAddToCartButtons();
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

  it("observes DOM when no buttons found", async () => {
    document.querySelectorAll.mockReturnValue([]);
    const observe = vi.fn();
    global.MutationObserver = vi.fn(() => ({ observe, disconnect: vi.fn() }));
    await bindAddToCartButtons();
    expect(global.MutationObserver).toHaveBeenCalled();
    expect(observe).toHaveBeenCalled();
  });
});
