// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Preserve original global references to restore after tests
const originalFetch = global.fetch;
const originalWindow = global.window;
const originalDocument = global.document;

vi.mock("../../core/auth/index.js", () => {
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

afterEach(() => {
  // Restore original globals after each test run
  if (originalFetch === undefined) {
    delete global.fetch;
  } else {
    global.fetch = originalFetch;
  }

  if (originalWindow === undefined) {
    delete global.window;
  } else {
    global.window = originalWindow;
  }

  if (originalDocument === undefined) {
    delete global.document;
  } else {
    global.document = originalDocument;
  }
});

describe("global smoothr alias", () => {
  it("exposes auth on window.smoothr", async () => {
    const core = await import("../../core/index.js");
    await new Promise(setImmediate);
    expect(global.window.Smoothr).toBe(core.default);
    expect(global.window.smoothr.auth).toBe(core.default.auth);
    expect(typeof global.window.Smoothr.orders.renderOrders).toBe("function");
    expect(typeof global.window.Smoothr.cart.addItem).toBe("function");
  });
});
