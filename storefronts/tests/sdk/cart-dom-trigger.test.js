import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const cartInitMock = vi.fn();
const globalKey = "__supabaseAuthClientsmoothr-browser-client";

function flushPromises() {
  return new Promise(setImmediate);
}

describe("cart DOM trigger", () => {
  beforeEach(() => {
    vi.resetModules();
    cartInitMock.mockReset();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );
    global.console = { log: vi.fn(), warn: vi.fn() };
    vi.doMock("../../supabase/supabaseClient.js", () => ({
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null })
            }))
          }))
        }))
      }
    }));
    vi.doMock("../../features/auth/init.js", () => ({ init: vi.fn() }));
    vi.doMock("../../features/currency/index.js", () => ({ init: vi.fn().mockResolvedValue() }));
    vi.doMock("../../features/cart/init.js", () => ({ init: cartInitMock }));
  });

  afterEach(() => {
    vi.doUnmock("../../supabase/supabaseClient.js");
    vi.doUnmock("../../features/auth/init.js");
    vi.doUnmock("../../features/currency/index.js");
    vi.doUnmock("../../features/cart/init.js");
    delete globalThis[globalKey];
  });

  it("imports cart when [data-smoothr=\"add-to-cart\"] is present", async () => {
    const scriptEl = { dataset: { storeId: "1" } };
    global.window = {
      location: { search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      readyState: "complete",
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(sel => (sel === '[data-smoothr="add-to-cart"]' ? {} : null)),
      getElementById: vi.fn(() => scriptEl),
    };
    await import("../../smoothr-sdk.js");
    await flushPromises();
    expect(cartInitMock).toHaveBeenCalled();
  });

  it("imports cart when [data-smoothr-add] is present", async () => {
    const scriptEl = { dataset: { storeId: "1" } };
    global.window = {
      location: { search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      readyState: "complete",
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(sel => (sel === '[data-smoothr-add]' ? {} : null)),
      getElementById: vi.fn(() => scriptEl),
    };
    await import("../../smoothr-sdk.js");
    await flushPromises();
    expect(cartInitMock).toHaveBeenCalled();
  });

  it("skips cart when no triggers present", async () => {
    const scriptEl = { dataset: { storeId: "1" } };
    global.window = {
      location: { search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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
    expect(cartInitMock).not.toHaveBeenCalled();
  });
});
