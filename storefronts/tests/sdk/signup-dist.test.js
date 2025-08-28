import { describe, it, expect, vi, beforeAll } from "vitest";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

const buildStorefronts = () =>
  new Promise((resolve, reject) => {
    const proc = spawn("pnpm", ["-C", "storefronts", "build:storefronts"], {
      stdio: "inherit",
      cwd: repoRoot,
    });
    proc.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`storefronts build failed: ${code}`)),
    );
    proc.on("error", reject);
  });

beforeAll(async () => {
  await buildStorefronts();
});

function flush() {
  return new Promise((r) => setTimeout(r, 0));
}

async function setupEnv(wrapperTag, { signUpReturn, mismatch } = {}) {
  vi.resetModules();
  document.body.innerHTML = "";
  const signUpMock = vi.fn(async () => signUpReturn ?? {
    data: { user: { id: "u1" } },
    error: null,
  });
  const sessionSyncSpy = vi.fn();
  globalThis.fetch = vi.fn(async () => {
    sessionSyncSpy();
    return { ok: true, json: async () => ({ ok: true }) };
  });
  globalThis.Smoothr = {
    __supabase: {
      auth: {
        signUp: signUpMock,
        getSession: vi.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
      },
    },
  };
  const sdk = await import(
    /* @vite-ignore */ `../../dist/smoothr-sdk.js?cache=${Date.now()}`
  );
  await sdk.__test_bootstrap({ storeId: "store" });
  const wrapper = document.createElement(wrapperTag);
  wrapper.setAttribute("data-smoothr", "auth-form");
  const pwd = "Passw0rd!";
  const confirm = mismatch ? "Mismatch" : pwd;
  wrapper.innerHTML = `
    <input data-smoothr="email" value="new@example.com" />
    <input data-smoothr="password" value="${pwd}" />
    <input data-smoothr="password-confirm" value="${confirm}" />
    <div data-smoothr="sign-up" role="button" tabindex="0"></div>
  `;
  document.body.appendChild(wrapper);
  try { globalThis.Smoothr.auth?.mutationCallback?.(); } catch {}
  const trigger = wrapper.querySelector('[data-smoothr="sign-up"]');
  const input = wrapper.querySelector('[data-smoothr="email"]');
  return { signUpMock, sessionSyncSpy, trigger, input };
}

describe.each(["form", "div"])("signup dist (%s wrapper)", (wrapper) => {
  it("click on trigger routes to signUp once", async () => {
    const { signUpMock, sessionSyncSpy, trigger } = await setupEnv(wrapper);
    const signedIn = vi.fn();
    document.addEventListener("smoothr:auth:signedin", signedIn);
    trigger.click();
    await flush();
    document.removeEventListener("smoothr:auth:signedin", signedIn);
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(sessionSyncSpy).toHaveBeenCalledTimes(1);
    expect(signedIn).toHaveBeenCalledTimes(1);
  });

  it("Enter key inside input triggers signUp once", async () => {
    const { signUpMock, sessionSyncSpy, input } = await setupEnv(wrapper);
    const signedIn = vi.fn();
    document.addEventListener("smoothr:auth:signedin", signedIn);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await flush();
    document.removeEventListener("smoothr:auth:signedin", signedIn);
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(sessionSyncSpy).toHaveBeenCalledTimes(1);
    expect(signedIn).toHaveBeenCalledTimes(1);
  });

  it("Space key on trigger (role=button) triggers signUp once", async () => {
    const { signUpMock, sessionSyncSpy, trigger } = await setupEnv(wrapper);
    const signedIn = vi.fn();
    document.addEventListener("smoothr:auth:signedin", signedIn);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await flush();
    document.removeEventListener("smoothr:auth:signedin", signedIn);
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(sessionSyncSpy).toHaveBeenCalledTimes(1);
    expect(signedIn).toHaveBeenCalledTimes(1);
  });

  it("signUp error emits smoothr:auth:error", async () => {
    const { signUpMock, sessionSyncSpy, trigger } = await setupEnv(wrapper, {
      signUpReturn: { data: { user: null }, error: { message: "bad" } },
    });
    const authErr = vi.fn();
    document.addEventListener("smoothr:auth:error", authErr);
    trigger.click();
    await flush();
    document.removeEventListener("smoothr:auth:error", authErr);
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(sessionSyncSpy).not.toHaveBeenCalled();
    expect(authErr).toHaveBeenCalledTimes(1);
  });

  it("password mismatch is a no-op and emits smoothr:auth:error", async () => {
    const { signUpMock, sessionSyncSpy, trigger } = await setupEnv(wrapper, {
      mismatch: true,
    });
    const authErr = vi.fn();
    document.addEventListener("smoothr:auth:error", authErr);
    trigger.click();
    await flush();
    document.removeEventListener("smoothr:auth:error", authErr);
    expect(signUpMock).not.toHaveBeenCalled();
    expect(sessionSyncSpy).not.toHaveBeenCalled();
    expect(authErr).toHaveBeenCalledTimes(1);
  });
});

