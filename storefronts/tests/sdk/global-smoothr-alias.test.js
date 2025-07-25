// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../core/auth/index.js", () => ({
  initAuth: vi.fn(),
  user: null,
  $$typeof: Symbol.for('react.test.json'),
  type: 'module',
  props: {},
  children: []
}));

// Mock remaining core modules to simple objects so import succeeds
const dummy = {
  $$typeof: Symbol.for('react.test.json'),
  type: 'module',
  props: {},
  children: []
};
vi.mock('../../core/abandoned-cart/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../core/affiliates/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../core/analytics/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../core/dashboard/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../core/discounts/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../core/cart.js', () => ({
  default: { addItem: vi.fn(), ...dummy },
  addItem: vi.fn(),
  ...dummy,
}));
vi.mock('../../core/orders/index.js', () => ({
  default: { renderOrders: vi.fn(), fetchOrderHistory: vi.fn(), ...dummy },
  renderOrders: vi.fn(),
  fetchOrderHistory: vi.fn(),
  ...dummy,
}));
vi.mock('../../core/returns/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../core/reviews/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../core/subscriptions/index.js', () => ({ default: dummy, ...dummy }));

vi.mock('../../core/currency/index.js', async () => {
  const actual = await vi.importActual('../../core/currency/index.js');
  return {
    ...actual,
    baseCurrency: 'USD',
    $$typeof: Symbol.for('react.test.json'),
    type: 'module',
    props: {},
    children: []
  };
});

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) }),
  );
  global.window = {
    location: { origin: "", href: "", hostname: "" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    SMOOTHR_CONFIG: { baseCurrency: 'USD' },
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
    await new Promise(setImmediate);
    expect(global.window.Smoothr).toBe(core.default);
    expect(global.window.smoothr).toBe(core.default);
    expect(typeof global.window.smoothr.orders.renderOrders).toBe("function");
    expect(typeof global.window.smoothr.cart.addItem).toBe("function");
  });
});
