import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const checkoutInitMock = vi.fn();
const globalKey = "__supabaseAuthClientsmoothr-browser-client";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("checkout DOM trigger", () => {
  beforeEach(() => {
    vi.resetModules();
    checkoutInitMock.mockReset();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    global.console = { log: vi.fn(), warn: vi.fn() };
    vi.doMock("../../supabase/browserClient.js", () => ({
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }))
          }))
        }))
      }
    }));
    vi.doMock("../../features/auth/init.js", () => ({ init: vi.fn() }));
    vi.doMock("../../features/currency/index.js", () => ({ init: vi.fn().mockResolvedValue() }));
    vi.doMock("../../features/cart/init.js", () => ({ init: vi.fn() }));
    vi.doMock("../../features/checkout/init.js", () => ({ init: checkoutInitMock }));
  });

  afterEach(() => {
    vi.doUnmock("../../supabase/browserClient.js");
    vi.doUnmock("../../features/auth/init.js");
    vi.doUnmock("../../features/currency/index.js");
    vi.doUnmock("../../features/cart/init.js");
    vi.doUnmock("../../features/checkout/init.js");
    delete globalThis[globalKey];
    delete global.window;
    delete global.document;
  });

  it("initializes checkout when trigger exists", async () => {
    const scriptEl = { dataset: { storeId: "1" } };
    global.location = { search: "" };
    global.window = {
      location: { search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      Smoothr: {},
      smoothr: {},
    };
    global.document = {
      readyState: "complete",
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(sel => (sel === '[data-smoothr="pay"]' ? {} : null)),
      getElementById: vi.fn(() => scriptEl),
    };

    await import("../../smoothr-sdk.js");
    await flushPromises();
    expect(checkoutInitMock).toHaveBeenCalled();
  });

  it("skips checkout when trigger absent", async () => {
    const scriptEl = { dataset: { storeId: "1" } };
    global.location = { search: "" };
    global.window = {
      location: { search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      Smoothr: {},
      smoothr: {},
    };
    global.document = {
      readyState: "complete",
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => null),
      getElementById: vi.fn(() => scriptEl),
    };

    await import("../../smoothr-sdk.js");
    await flushPromises();
    expect(checkoutInitMock).not.toHaveBeenCalled();
  });
});
