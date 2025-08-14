import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("checkout DOM trigger", () => {
  let checkoutInitMock;
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    vi.resetModules();
    window.Smoothr = { ready: Promise.resolve({}) };
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({}) })
    );
    checkoutInitMock = vi.fn();
    vi.mock('storefronts/features/auth/init.js', () => ({ __esModule: true, default: vi.fn() }));
    vi.mock('storefronts/features/checkout/init.js', () => {
      checkoutInitMock();
      return { __esModule: true };
    });
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true });
  });

  afterEach(() => {
    vi.unmock('storefronts/features/auth/init.js');
    vi.unmock('storefronts/features/checkout/init.js');
    document.body.innerHTML = "";
    delete window.Smoothr;
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true });
    vi.restoreAllMocks();
  });

  it("initializes checkout when trigger exists", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    scriptEl.src = 'https://example.com/smoothr-sdk.js';
    document.body.appendChild(scriptEl);
    Object.defineProperty(document, 'currentScript', { value: scriptEl, configurable: true });
    const trigger = document.createElement('button');
    trigger.setAttribute('data-smoothr', 'pay');
    document.body.appendChild(trigger);

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await flush();

    expect(checkoutInitMock).toHaveBeenCalled();
  });

  it("skips checkout when trigger absent", async () => {
    const scriptEl = document.createElement('script');
    scriptEl.dataset.storeId = '1';
    scriptEl.id = 'smoothr-sdk';
    scriptEl.src = 'https://example.com/smoothr-sdk.js';
    document.body.appendChild(scriptEl);
    Object.defineProperty(document, 'currentScript', { value: scriptEl, configurable: true });

    await import("../../smoothr-sdk.js");
    await window.Smoothr.ready;
    await flush();

    expect(checkoutInitMock).not.toHaveBeenCalled();
  });
});
