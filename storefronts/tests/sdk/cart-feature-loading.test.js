import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";

describe("cart feature loading", () => {
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
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it("initializes cart when [data-smoothr-total] exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    const totalEl = document.createElement('div');
    totalEl.setAttribute('data-smoothr-total', '');
    document.body.appendChild(totalEl);

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await Promise.resolve();
    await Promise.resolve();

    expect(cartInitMock).toHaveBeenCalled();
  });

  it("logs when cart triggers are absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    const warnSpy = vi.spyOn(console, "warn");

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await Promise.resolve();
    await Promise.resolve();

    expect(cartInitMock).not.toHaveBeenCalled();
    expect(warnSpy.mock.calls).toContainEqual([
      "[Smoothr SDK] No cart triggers found, skipping cart initialization",
    ]);
  });
});

