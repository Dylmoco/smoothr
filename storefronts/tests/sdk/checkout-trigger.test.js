import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("checkout DOM trigger", () => {
  let checkoutInitMock;

  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({}) })
    );
    checkoutInitMock = vi.fn();
    vi.mock("../../features/auth/init.js", () => ({ __esModule: true, default: vi.fn() }));
    vi.mock("../../features/checkout/init.js", () => {
      checkoutInitMock();
      return { __esModule: true };
    });
  });

  afterEach(() => {
    vi.unmock("../../features/auth/init.js");
    vi.unmock("../../features/checkout/init.js");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("initializes checkout when trigger exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);
    const trigger = document.createElement('button');
    trigger.setAttribute('data-smoothr', 'pay');
    document.body.appendChild(trigger);

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await Promise.resolve();
    await Promise.resolve();

    expect(checkoutInitMock).toHaveBeenCalled();
  });

  it("skips checkout when trigger absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    document.body.appendChild(scriptEl);

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await Promise.resolve();
    await Promise.resolve();

    expect(checkoutInitMock).not.toHaveBeenCalled();
  });
});
