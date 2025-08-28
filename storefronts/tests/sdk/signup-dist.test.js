import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

let buildStorefronts;
async function ensureBuilt() {
  // Ensure Node's Uint8Array is used so esbuild's environment checks pass
  globalThis.Uint8Array = new TextEncoder().encode("").constructor;
  if (!buildStorefronts) {
    ({ buildStorefronts } = await import("../../../scripts/build-storefronts-dist.mjs"));
  }
  await buildStorefronts(); // throws on failure
}

beforeAll(async () => {
  await ensureBuilt();

  window.__SMOOTHR_TEST_SUPABASE__ = {
    auth: {
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
    },
  };

  window.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ redirect_url: "/" }),
  });

  const distPath = path.join(repoRoot, "storefronts/dist/smoothr-sdk.js");
  const code = await fs.promises.readFile(distPath, "utf8");
  const stripped = code.replace(
    /export\{Fo as SDK_TAG,tu as __test_bootstrap\};/,
    "window.Smoothr=window.Smoothr||{};window.Smoothr.SDK_TAG=Fo;window.Smoothr.__test_bootstrap=tu;",
  );
  new Function(stripped)();
});

beforeEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

function flush() {
  return new Promise((r) => setTimeout(r, 0));
}

function dispatchKeyboard(key) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

async function setupDom(wrapperTag, { mismatch } = {}) {
  await window.Smoothr.__test_bootstrap({ storeId: "store" });
  window.__SMOOTHR_TEST_SUPABASE__.auth.signUp.mockClear();
  const wrapper = document.createElement(wrapperTag);
  wrapper.setAttribute("data-smoothr", "auth-form");
  const pwd = "Passw0rd!";
  const confirm = mismatch ? "Mismatch" : pwd;
  wrapper.innerHTML = `
    <input data-smoothr="email" value="new@example.com" />
    <input data-smoothr="password" value="${pwd}" />
    <input data-smoothr="password-confirm" value="${confirm}" />
    <div data-smoothr="sign-up" tabindex="0"></div>
  `;
  document.body.appendChild(wrapper);
  const trigger = wrapper.querySelector('[data-smoothr="sign-up"]');
  const input = wrapper.querySelector('[data-smoothr="email"]');
  return { container: wrapper, trigger, input };
}

describe.each(["form", "div"])("signup dist (%s wrapper)", (wrapper) => {
  it("click on trigger routes to signUp once", async () => {
    const { container, trigger } = await setupDom(wrapper);
    const errorSpy = vi.fn();
    window.addEventListener("smoothr:auth:error", errorSpy, { once: false });
    trigger.click();
    await flush();
    expect(window.__SMOOTHR_TEST_SUPABASE__.auth.signUp).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    window.removeEventListener("smoothr:auth:error", errorSpy);
  });

  it("Enter key inside input triggers signUp once", async () => {
    const { container } = await setupDom(wrapper);
    const errorSpy = vi.fn();
    window.addEventListener("smoothr:auth:error", errorSpy, { once: false });
    const email = container.querySelector('[data-smoothr="email"]');
    email.focus();
    dispatchKeyboard("Enter");
    await flush();
    expect(window.__SMOOTHR_TEST_SUPABASE__.auth.signUp).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    window.removeEventListener("smoothr:auth:error", errorSpy);
  });

  it("Space key on trigger (role=button) triggers signUp once", async () => {
    const { container } = await setupDom(wrapper);
    const errorSpy = vi.fn();
    window.addEventListener("smoothr:auth:error", errorSpy, { once: false });
    const trigger = container.querySelector('[data-smoothr="sign-up"]');
    trigger.setAttribute("role", "button");
    trigger.focus();
    dispatchKeyboard(" ");
    await flush();
    expect(window.__SMOOTHR_TEST_SUPABASE__.auth.signUp).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    window.removeEventListener("smoothr:auth:error", errorSpy);
  });

  it("password mismatch emits smoothr:auth:error", async () => {
    const { container } = await setupDom(wrapper, { mismatch: true });
    const errorSpy = vi.fn();
    document.addEventListener("smoothr:auth:error", errorSpy, { once: false });
    const trigger = container.querySelector('[data-smoothr="sign-up"]');
    trigger.focus();
    trigger.click();
    await flush();
    expect(window.__SMOOTHR_TEST_SUPABASE__.auth.signUp).toHaveBeenCalledTimes(0);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    document.removeEventListener("smoothr:auth:error", errorSpy);
  });
});

