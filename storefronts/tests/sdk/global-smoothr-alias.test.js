// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../features/auth/index.js", () => {
  const authMock = {
    initAuth: vi.fn().mockResolvedValue(),
    user: null,
    $$typeof: Symbol.for('react.test.json'),
    type: 'module',
    props: {},
    children: []
  };
  return { default: authMock, ...authMock };
});

// Mock remaining core modules to simple objects so import succeeds
const dummy = {
  $$typeof: Symbol.for('react.test.json'),
  type: 'module',
  props: {},
  children: []
};
vi.mock('../../features/abandoned-cart/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../features/affiliates/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../features/analytics/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../features/dashboard/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../features/discounts/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../features/cart/index.js', () => ({
  default: { addItem: vi.fn(), ...dummy },
  addItem: vi.fn(),
  ...dummy,
}));
vi.mock('../../features/orders/index.js', () => ({
  default: { renderOrders: vi.fn(), fetchOrderHistory: vi.fn(), ...dummy },
  renderOrders: vi.fn(),
  fetchOrderHistory: vi.fn(),
  ...dummy,
}));
vi.mock('../../features/returns/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../features/reviews/index.js', () => ({ default: dummy, ...dummy }));
vi.mock('../../features/subscriptions/index.js', () => ({ default: dummy, ...dummy }));

vi.mock('../../features/currency/index.js', async () => {
  const actual = await vi.importActual('../../features/currency/index.js');
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
  it("exposes auth on window.smoothr", async () => {
    const core = await import("../../features/index.js");
    await new Promise(setImmediate);
    expect(global.window.Smoothr).toBe(core.default);
    expect(global.window.smoothr.auth).toBe(core.default.auth);
    expect(typeof global.window.Smoothr.orders.renderOrders).toBe("function");
    expect(typeof global.window.Smoothr.cart.addItem).toBe("function");
  });
});
