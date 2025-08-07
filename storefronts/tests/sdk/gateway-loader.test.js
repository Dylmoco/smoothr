import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocked = [];

function trackMock(path, factory) {
  mocked.push(path);
  return vi.doMock(path, factory);
}

function setupEnv(provider, modulePath) {
  const loadScriptMock = vi.fn();
  let mounted = false;
  const mountMock = vi.fn(() => {
    mounted = true;
  });
  trackMock(modulePath, () => ({
    default: {
      mountCheckout: mountMock,
      mountCardFields: mountMock,
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
    default: loadScriptMock
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
  return { loadScriptMock };
}

describe("gateway loader", () => {
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
    ["stripe", "https://js.stripe.com/v3/", "../../features/checkout/gateways/stripeGateway.js"],
    [
      "authorizeNet",
      "https://jstest.authorize.net/v1/Accept.js",
      "../../features/checkout/gateways/authorizeNet.js"
    ],
    [
      "nmi",
      "https://secure.nmi.com/token/Collect.js",
      "../../features/checkout/gateways/nmiGateway.js"
    ]
  ])("loads script for %s", async (provider, url, path) => {
    const { loadScriptMock } = setupEnv(provider, path);
    const { init } = await import("../../features/checkout/init.js");
    await init({ active_payment_gateway: provider, storeId: "1" });
    expect(loadScriptMock).toHaveBeenCalledWith(url, expect.any(Object));
  });
});
