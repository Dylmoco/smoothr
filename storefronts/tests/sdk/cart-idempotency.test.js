import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomStub } from "../utils/dom-stub";

let button;

describe("cart init idempotency", () => {
    let realDocument;
    beforeEach(async () => {
      vi.resetModules();
      button = { addEventListener: vi.fn() };
      global.console = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      global.window = {
        Smoothr: {},
        location: { pathname: "", search: "" },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      realDocument = global.document;
      global.document = createDomStub({
        querySelectorAll: vi.fn((sel) =>
          sel === "[data-smoothr=\"add-to-cart\"]" ? [button] : []
        ),
      });
    });

    afterEach(() => {
      global.document = realDocument;
    });

  it("returns same instance and binds listeners once", async () => {
    const cartMod = await import("../../features/cart/init.js");
    const first = await cartMod.init({ storeId: "1" });
    const second = await cartMod.init({ storeId: "1" });
    expect(first).toBe(second);
    expect(button.addEventListener).toHaveBeenCalledTimes(1);
  });
});
