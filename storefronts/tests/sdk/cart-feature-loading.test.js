import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const cartInitMock = vi.fn();
const globalKey = '__supabaseAuthClientsmoothr-browser-client';

function flushPromises() {
  return new Promise(setImmediate);
}

describe("cart feature loading", () => {
  beforeEach(() => {
    vi.resetModules();
    cartInitMock.mockReset();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    global.console = { log: vi.fn(), warn: vi.fn() };
    vi.doMock("../../shared/supabase/browserClient.js", () => {
      const client = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }))
          }))
        }))
      };
      return { default: client, getClient: () => client };
    });
    vi.doMock("../../features/auth/init.js", () => ({ init: vi.fn() }));
    vi.doMock("../../features/currency/index.js", () => ({ init: vi.fn().mockResolvedValue() }));
    vi.doMock("../../features/cart/init.js", () => ({ init: cartInitMock }));
  });

  afterEach(() => {
    vi.doUnmock("../../shared/supabase/browserClient.js");
    vi.doUnmock("../../features/auth/init.js");
    vi.doUnmock("../../features/currency/index.js");
    vi.doUnmock("../../features/cart/init.js");
    delete globalThis[globalKey];
  });

  it.each([
    '[data-smoothr="add-to-cart"]',
    '[data-smoothr-total]',
    '[data-smoothr-cart]'
  ])("initializes cart when trigger %s exists", async selector => {
    const scriptEl = { dataset: { storeId: "1" } };
    global.location = { search: "" };
    global.window = {
      location: { search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      readyState: "complete",
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(sel => (sel === selector ? {} : null)),
      getElementById: vi.fn(() => scriptEl),
    };

    await import("../../smoothr-sdk.js");
    await flushPromises();
    expect(cartInitMock).toHaveBeenCalled();
  });

  it("logs when cart triggers are absent", async () => {
    const scriptEl = { dataset: { storeId: "1" } };
    global.location = { search: "?smoothr-debug=true" };
    global.window = {
      location: { search: "?smoothr-debug=true" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const logSpy = console.log;
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
    expect(logSpy).toHaveBeenCalledWith("[Smoothr SDK]", "No cart triggers found, skipping cart initialization");
  });
});

