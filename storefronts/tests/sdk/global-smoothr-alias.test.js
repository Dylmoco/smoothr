// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../core/auth/index.js", () => ({
  initAuth: vi.fn(),
  user: null,
  $$typeof: Symbol.for('react.test.json'),
  type: 'module',
  props: {}
}));

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
  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    currentScript: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } },
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
