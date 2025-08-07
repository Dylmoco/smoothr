// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../features/auth/init.js", () => ({
  init: vi.fn(),
}));
vi.mock("../../features/currency/index.js", () => ({
  init: vi.fn(),
}));

describe("platform detection", () => {
  let scriptEl;

  beforeEach(() => {
    vi.resetModules();
    scriptEl = null;

    global.location = { search: "" };
    global.window = {
      location: { search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = {
      readyState: "complete",
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      getElementById: vi.fn(() => scriptEl),
    };
  });

  it("uses data-platform attribute", async () => {
    scriptEl = {
      dataset: { storeId: "1", platform: "webflow" },
      getAttribute: vi.fn(() => null),
    };
    global.document.getElementById.mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    expect(global.window.Smoothr.config.platform).toBe("webflow");
  });

  it("uses platform attribute when data-platform missing", async () => {
    scriptEl = {
      dataset: { storeId: "1" },
      getAttribute: vi.fn((name) => (name === "platform" ? "magento" : null)),
    };
    global.document.getElementById.mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    expect(global.window.Smoothr.config.platform).toBe("magento");
  });

  it("prefers data-platform over platform attribute", async () => {
    scriptEl = {
      dataset: { storeId: "1", platform: "webflow" },
      getAttribute: vi.fn((name) => (name === "platform" ? "magento" : null)),
    };
    global.document.getElementById.mockReturnValue(scriptEl);

    await import("../../smoothr-sdk.js");
    expect(global.window.Smoothr.config.platform).toBe("webflow");
  });
});
