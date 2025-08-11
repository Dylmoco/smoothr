import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LOG } from "../../utils/logger.js";

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
    global.console = { log: vi.fn(), warn: vi.fn(), info: vi.fn() };
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
    vi.doMock("../../features/cart/init.js", () => ({ init: vi.fn() }));
    vi.doMock("../../features/checkout/init.js", () => ({
      init: checkoutInitMock.mockImplementation(() => {
        console.info(LOG.CHECKOUT_READY("stripe"));
      }),
    }));
  });

  afterEach(() => {
    vi.doUnmock("../../shared/supabase/browserClient.js");
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
    expect(global.console.info).toHaveBeenCalledWith(
      LOG.CHECKOUT_READY("stripe")
    );
  });

  it("skips checkout when trigger absent", async () => {
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
      querySelector: vi.fn(() => null),
      getElementById: vi.fn(() => scriptEl),
    };

    await import("../../smoothr-sdk.js");
    await flushPromises();
    expect(checkoutInitMock).not.toHaveBeenCalled();
  });
});
