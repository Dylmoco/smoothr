// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomStub } from "../utils/dom-stub";

vi.mock("../../features/auth/index.js", () => {
  const authMock = {
    initAuth: vi.fn().mockResolvedValue(),
    user: null,
    $$typeof: Symbol.for('react.test.json'),
    type: 'module',
    props: {},
    children: []
  };
  authMock.init = vi.fn(async () => {
    global.window.Smoothr = global.window.Smoothr || {};
    global.window.Smoothr.auth = authMock;
  });
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

let realDocument;
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
  realDocument = global.document;
  global.document = createDomStub({
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    currentScript: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } },
  });
});

afterEach(() => {
  global.document = realDocument;
});

describe("global smoothr alias", () => {
  it("exposes auth and checkout APIs on window.Smoothr", async () => {
    const { init } = await import("../../features/auth/index.js");
    const checkout = await import("../../features/checkout/checkout-core.js");
    await init(global.window.SMOOTHR_CONFIG);
    Object.assign(global.window.Smoothr, checkout);
    await new Promise(setImmediate);
    expect(global.window.Smoothr.auth).toBeDefined();
    expect(typeof global.window.Smoothr.orders.renderOrders).toBe("function");
    expect(typeof global.window.Smoothr.cart.addItem).toBe("function");
  });
});
