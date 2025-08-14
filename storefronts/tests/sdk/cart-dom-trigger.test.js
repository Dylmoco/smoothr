import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

describe("cart DOM trigger", () => {
  let cartInitMock;

  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({}) })
    );
    cartInitMock = vi.fn();
    vi.mock("../../features/auth/init.js", () => ({ __esModule: true, default: vi.fn() }));
    vi.mock("../../features/checkout/init.js", () => ({ __esModule: true, default: vi.fn() }));
    vi.mock("../../features/cart/index.js", () => {
      cartInitMock();
      return { __esModule: true };
    });
  });

  afterEach(() => {
    vi.unmock("../../features/auth/init.js");
    vi.unmock("../../features/checkout/init.js");
    vi.unmock("../../features/cart/index.js");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("imports cart when [data-smoothr=\"add-to-cart\"] is present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    const trigger = document.createElement('button');
    trigger.setAttribute('data-smoothr', 'add-to-cart');
    document.body.appendChild(trigger);

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await Promise.resolve();
    await Promise.resolve();

    expect(cartInitMock).toHaveBeenCalled();
  });

  it("skips cart when no triggers present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await Promise.resolve();
    await Promise.resolve();

    expect(cartInitMock).not.toHaveBeenCalled();
  });
});
