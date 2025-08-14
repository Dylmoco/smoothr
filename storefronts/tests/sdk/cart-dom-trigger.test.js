import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

describe("cart DOM trigger", () => {
  let cartInitMock;
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    vi.resetModules();
    window.Smoothr = { ready: Promise.resolve({}) };
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({}) })
    );
    cartInitMock = vi.fn();
    vi.mock('storefronts/features/auth/init.js', () => ({ __esModule: true, default: vi.fn() }));
    vi.mock('storefronts/features/checkout/init.js', () => ({ __esModule: true, default: vi.fn() }));
    vi.mock('storefronts/features/cart/index.js', () => {
      cartInitMock();
      return { __esModule: true };
    });
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true });
  });

  afterEach(() => {
    vi.unmock('storefronts/features/auth/init.js');
    vi.unmock('storefronts/features/checkout/init.js');
    vi.unmock('storefronts/features/cart/index.js');
    document.body.innerHTML = "";
    delete window.Smoothr;
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true });
    vi.restoreAllMocks();
  });

  it("imports cart when [data-smoothr=\"add-to-cart\"] is present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    scriptEl.src = 'https://example.com/smoothr-sdk.js';
    document.body.appendChild(scriptEl);
    Object.defineProperty(document, 'currentScript', { value: scriptEl, configurable: true });
    const trigger = document.createElement('button');
    trigger.setAttribute('data-smoothr', 'add-to-cart');
    document.body.appendChild(trigger);

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await flush();

    expect(cartInitMock).toHaveBeenCalled();
  });

  it("skips cart when no triggers present", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    scriptEl.src = 'https://example.com/smoothr-sdk.js';
    document.body.appendChild(scriptEl);
    Object.defineProperty(document, 'currentScript', { value: scriptEl, configurable: true });

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await flush();

    expect(cartInitMock).not.toHaveBeenCalled();
  });
});
