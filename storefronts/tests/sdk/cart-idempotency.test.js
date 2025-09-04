import { describe, it, expect, beforeEach, vi } from "vitest";

let button;

describe("cart init idempotency", () => {
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
    global.document = {
      querySelectorAll: vi.fn((sel) =>
        sel === "[data-smoothr=\"add-to-cart\"]" ? [button] : []
      ),
    };
  });

  it("returns same instance and binds listeners once", async () => {
    const cartMod = await import("../../features/cart/init.js");
    const first = await cartMod.init({ storeId: "1" });
    const second = await cartMod.init({ storeId: "1" });
    expect(first).toBe(second);
    expect(button.addEventListener).toHaveBeenCalledTimes(1);
  });
});
