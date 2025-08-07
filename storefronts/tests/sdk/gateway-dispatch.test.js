import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocked = [];

function trackMock(path, factory) {
  mocked.push(path);
  return vi.doMock(path, factory);
}

function setupEnv(modulePath) {
  let mounted = false;
  const mountCheckoutMock = vi.fn(() => {
    mounted = true;
  });
  trackMock(modulePath, () => ({
    default: {
      mountCheckout: mountCheckoutMock,
      mountCardFields: mountCheckoutMock,
      isMounted: () => mounted
    }
  }));
  trackMock("../../features/checkout/utils/checkoutLogger.js", () => ({
    default: () => ({
      log: vi.fn(),
      warn: vi.fn(),
      err: vi.fn(),
      select: vi.fn(async () => ({})),
      q: vi.fn(() => null)
    })
  }));
  trackMock("../../features/checkout/utils/collectFormFields.js", () => ({
    default: vi.fn(() => ({ emailField: {} }))
  }));
  trackMock("../../features/checkout/utils/inputFormatters.js", () => ({
    default: vi.fn()
  }));
  trackMock("../../features/config/sdkConfig.ts", () => ({
    loadPublicConfig: vi.fn(async () => null)
  }));
  trackMock("../../features/config/globalConfig.js", () => {
    let cfg = {};
    return {
      mergeConfig: obj => Object.assign(cfg, obj),
      getConfig: () => cfg
    };
  });
  trackMock("../../utils/platformReady.js", () => ({
    platformReady: vi.fn(async () => {})
  }));
  trackMock("../../utils/loadScriptOnce.js", () => ({
    default: vi.fn()
  }));

  const payBtn = { tagName: "button", addEventListener: vi.fn() };
  global.document = {
    querySelector: vi.fn(sel => {
      if (sel === "[data-smoothr-pay]") return payBtn;
      if (sel === "#smoothr-card-styles") return null;
      return null;
    }),
    querySelectorAll: vi.fn(sel => (sel === "[data-smoothr-pay]" ? [payBtn] : [])),
    createElement: vi.fn(() => ({ style: {}, id: "", textContent: "" })),
    head: { appendChild: vi.fn() }
  };
  global.window = {
    location: { pathname: "", search: "" },
    Smoothr: { cart: { getCart: () => ({ items: [] }), getTotal: () => 0 } },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
  return { mountCheckoutMock };
}

describe("gateway dispatch", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    mocked.forEach(m => vi.doUnmock(m));
    mocked.length = 0;
    delete global.window;
    delete global.document;
  });

  it.each([
    ["stripe", "../../features/checkout/gateways/stripeGateway.js"],
    ["authorizeNet", "../../features/checkout/gateways/authorizeNet.js"],
    ["paypal", "../../features/checkout/gateways/paypal.js"],
    ["nmi", "../../features/checkout/gateways/nmiGateway.js"],
    ["segpay", "../../features/checkout/gateways/segpay.js"]
  ])("dispatches to %s", async (provider, path) => {
    const { mountCheckoutMock } = setupEnv(path);
    const { init } = await import("../../features/checkout/init.js");
    await init({ active_payment_gateway: provider, storeId: "1" });
    expect(mountCheckoutMock).toHaveBeenCalled();
  });
});
