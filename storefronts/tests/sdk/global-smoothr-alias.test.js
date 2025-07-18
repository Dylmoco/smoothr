// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../core/auth/index.js", () => ({ initAuth: vi.fn(), user: null }));

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) }),
  );
  global.window = {
    location: { origin: "", href: "", hostname: "" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
});

describe("global smoothr alias", () => {
  it("sets window.smoothr referencing the Smoothr object", async () => {
    const core = await import("../../core/index.js");
    expect(global.window.Smoothr).toBe(core.default);
    expect(global.window.smoothr).toBe(core.default);
    expect(typeof global.window.smoothr.orders.renderOrders).toBe("function");
    expect(typeof global.window.smoothr.cart.addItem).toBe("function");
  });
});
