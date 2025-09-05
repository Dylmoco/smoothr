// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClientMock, currentSupabaseMocks } from "../utils/supabase-mock";
let auth;

const STORE_ID = "test-store";


function flushPromises() {
  return new Promise(setImmediate);
}

const LOGIN_SELECTOR = '[data-smoothr="login"]';
const OTHER_SELECTOR =
  '[data-smoothr="sign-up"], [data-smoothr="login-google"], [data-smoothr="login-apple"], [data-smoothr="password-reset"]';
const ACCOUNT_ACCESS_SELECTOR = '[data-smoothr="account-access"]';

it('routes submit on reset-only form to password-reset handler', async () => {
  vi.resetModules();
  createClientMock();
  auth = await import("../../features/auth/index.js");
  await auth.init();
  await flushPromises();

  const form = document.createElement('form');
  form.setAttribute('data-smoothr', 'auth-form');
  form.innerHTML = `
    <input data-smoothr="email" value="user@example.com" />
    <div data-smoothr="password-reset"></div>
  `;
  document.body.appendChild(form);
  const evt = new Event('submit', { bubbles: true, cancelable: true });
  // Should not throw; router should pick the reset control and handle gracefully
  expect(() => form.dispatchEvent(evt)).not.toThrow();
});

describe("dynamic DOM bindings", () => {
  let mutationCallback;
  let elements;
  let forms;
  let doc;
  let win;
  let docClickHandler;

    beforeEach(async () => {
      vi.resetModules();
      document?.dispatchEvent?.mockClear?.();
      createClientMock();
      const { getUserMock } = currentSupabaseMocks();
      getUserMock.mockResolvedValue({ data: { user: null } });
      elements = [];
      forms = [];
      mutationCallback = undefined;
      docClickHandler = undefined;
    global.MutationObserver = class {
      constructor(cb) {
        mutationCallback = cb;
      }
      observe() {}
      disconnect() {}
    };
    doc = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
        if (evt === "click") docClickHandler = cb;
      }),
      querySelectorAll: vi.fn((selector) => {
        if (selector.includes(LOGIN_SELECTOR)) {
          return elements.filter((el) => el.dataset?.smoothr === "login");
        }
        if (
          selector.includes('[data-smoothr="sign-up"]') ||
          selector.includes('[data-smoothr="login-google"]') ||
          selector.includes('[data-smoothr="login-apple"]') ||
          selector.includes('[data-smoothr="password-reset"]')
        ) {
          return elements.filter((el) =>
            ["sign-up", "login-google", "login-apple", "password-reset"].includes(
              el.dataset?.smoothr
            )
          );
        }
        if (selector.includes(ACCOUNT_ACCESS_SELECTOR)) {
          return elements.filter((el) => el.dataset?.smoothr === "account-access");
        }
        if (selector.includes('[data-smoothr="auth-form"]')) {
          return forms;
        }
        if (selector.includes('[data-smoothr="sign-out"]')) {
          return elements.filter((el) => el.dataset?.smoothr === "sign-out");
        }
        return [];
      }),
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="auth-pop-up"]') return {};
        return null;
      }),
      dispatchEvent() {
        return true;
      },
    };
      const loc = { origin: "", assign: vi.fn(), replace: vi.fn() };
    Object.defineProperty(loc, "href", { get() { return ""; }, set(url) { this.replace(url); } });
    win = {
      location: loc,
      addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        SMOOTHR_CONFIG: { storeId: STORE_ID, store_id: STORE_ID },
      };
      global.document = doc;
    vi.spyOn(document, "dispatchEvent").mockImplementation(() => true);
    document.dispatchEvent.mockClear();
    global.window = win;
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  it("attaches listeners to added login elements and updates auth state", async () => {
    const emailInput = { value: "user@example.com" };
    const passwordInput = { value: "Password1" };
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]') return emailInput;
        if (sel === '[data-smoothr="password"]') return passwordInput;
        if (sel === '[data-smoothr="login"]') return btn;
        return null;
      }),
    };
    let clickHandler;
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "login" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "login" : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
    };
    btn.closest = vi.fn((sel) => {
      if (sel === '[data-smoothr]') return btn;
      if (sel === '[data-smoothr="auth-form"]') return form;
      return null;
    });

      await auth.init({ supabase: createClientMock() });
    await flushPromises();
    expect(btn.addEventListener).not.toHaveBeenCalled();

    forms.push(form);
    elements.push(btn);
    mutationCallback();
    expect(btn.addEventListener).toHaveBeenCalled();

    const user = { id: "1", email: "user@example.com" };
    const { signInMock } = currentSupabaseMocks();
    signInMock.mockResolvedValue({ data: { user }, error: null });
    await clickHandler({ preventDefault: () => {}, target: btn });
    await flushPromises();

    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    const types = global.document.dispatchEvent.mock.calls.map(c => c[0]?.type);
    expect(types).toContain("smoothr:login");
    expect(types.at(-1)).toBe("smoothr:auth:close");
  });

  it("attaches listeners to added sign-up elements and updates auth state", async () => {
    const emailInput = { value: "new@example.com" };
    const passwordInput = { value: "Password1" };
    const confirmInput = { value: "Password1" };
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]') return emailInput;
        if (sel === '[data-smoothr="password"]') return passwordInput;
        if (sel === '[data-smoothr="password-confirm"]')
          return confirmInput;
        if (sel === '[data-smoothr="sign-up"]') return btn;
        return null;
      }),
    };
    let clickHandler;
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "sign-up" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "sign-up" : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
    };
    btn.closest = vi.fn((sel) => {
      if (sel === '[data-smoothr]') return btn;
      if (sel === '[data-smoothr="auth-form"]') return form;
      return null;
    });

      await auth.init({ supabase: createClientMock() });
    await flushPromises();
    forms.push(form);
    elements.push(btn);
    mutationCallback();
    expect(btn.addEventListener).toHaveBeenCalled();

    const user = { id: "2", email: "new@example.com" };
    const { signUpMock } = currentSupabaseMocks();
    signUpMock.mockResolvedValue({ data: { user }, error: null });
    await clickHandler({ preventDefault: () => {}, target: btn });
    await flushPromises();

    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    const types = global.document.dispatchEvent.mock.calls.map(c => c[0]?.type);
    expect(types).toContain("smoothr:login");
    expect(types.at(-1)).toBe("smoothr:auth:close");
  });

  it("attaches listeners to added google login elements and dispatches login event", async () => {
    let clickHandler;
    const btn = {
      tagName: "DIV",
      dataset: { smoothr: "login-google" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "login-google" : null),
      closest: vi.fn(() => null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
    };

    global.window.open = vi.fn().mockReturnValue(null);
      await auth.init({ supabase: createClientMock() });
    await flushPromises();
    elements.push(btn);
    mutationCallback();
    expect(btn.addEventListener).toHaveBeenCalled();

    await clickHandler({ preventDefault: () => {}, target: btn });
    expect(global.window.location.replace).toHaveBeenCalledWith(
      'https://auth.smoothr.io/authorize?store_id=test-store&redirect_to=%2Fauth%2Fcallback'
    );
  });

  it("attaches listeners to added apple login elements and dispatches login event", async () => {
    let clickHandler;
    const btn = {
      tagName: "DIV",
      dataset: { smoothr: "login-apple" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "login-apple" : null),
      closest: vi.fn(() => null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
    };

    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    elements.push(btn);
    mutationCallback();
    expect(btn.addEventListener).toHaveBeenCalled();

    const { signInWithOAuthMock } = currentSupabaseMocks();
    signInWithOAuthMock.mockResolvedValue({});
    await clickHandler({ preventDefault: () => {}, target: btn });
    await flushPromises();

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "apple",
      options: { redirectTo: "", data: { store_id: STORE_ID } },
    });

    const user = { id: "4", email: "apple@example.com" };
    document.dispatchEvent.mockClear();
    global.window.Smoothr = {};
    vi.resetModules();
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
    const client = createClientMock();
    const { getUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValue({ data: { user } });
    await auth.init({ supabase: client });
    await flushPromises();

    expect(global.document.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
    const evt = global.document.dispatchEvent.mock.calls.at(-1)[0];
    expect(evt).toBeInstanceOf(CustomEvent);
    expect(evt.type).toBe("smoothr:login");
  });

  it.skip("attaches listeners to added password reset elements and shows inline messages", async () => {
    const emailInput = { value: "user@example.com" };
    const successEl = {
      textContent: "",
      style: { display: "none" },
      hidden: true,
      hasAttribute: vi.fn((attr) => attr === "hidden" && "hidden" in successEl),
      removeAttribute: vi.fn((attr) => {
        if (attr === "hidden") delete successEl.hidden;
      }),
    };
    const errorEl = {
      textContent: "",
      style: { display: "none" },
      hidden: true,
      hasAttribute: vi.fn((attr) => attr === "hidden" && "hidden" in errorEl),
      removeAttribute: vi.fn((attr) => {
        if (attr === "hidden") delete errorEl.hidden;
      }),
    };
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((sel) => {
        if (sel === '[data-smoothr="email"]') return emailInput;
        if (sel === "[data-smoothr-success]") return successEl;
        if (sel === "[data-smoothr-error]") return errorEl;
        if (sel === '[data-smoothr="password-reset"]') return btn;
        return null;
      }),
    };
    let clickHandler;
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "password-reset" },
      getAttribute: (attr) =>
        attr === "data-smoothr" ? "password-reset" : null,
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
    };
    btn.closest = vi.fn((sel) => {
      if (sel === '[data-smoothr]') return btn;
      if (sel === '[data-smoothr="auth-form"]') return form;
      return null;
    });

    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    forms.push(form);
    elements.push(btn);
    mutationCallback();
    expect(btn.addEventListener).toHaveBeenCalled();

    const { resetPasswordMock } = currentSupabaseMocks();
    resetPasswordMock.mockResolvedValue({ data: {}, error: null });
    await clickHandler({ preventDefault: () => {}, target: btn });
    await flushPromises();

    expect(resetPasswordMock).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.any(String),
      })
    );
    expect(successEl.textContent).toBe("Check your email for a reset link.");
    expect(errorEl.textContent).toBe("");
    expect(successEl.removeAttribute).toHaveBeenCalledWith("hidden");
    expect(successEl.hidden).toBeUndefined();
    expect(successEl.style.display).toBe("");

    resetPasswordMock.mockResolvedValue({
      data: null,
      error: new Error("oops"),
    });
    await clickHandler({ preventDefault: () => {}, target: btn });
    await flushPromises();

    expect(errorEl.textContent).toBe("oops");
    expect(errorEl.removeAttribute).toHaveBeenCalledWith("hidden");
    expect(errorEl.hidden).toBeUndefined();
    expect(errorEl.style.display).toBe("");
  });

  it("binds newly added account-access elements and dispatches auth:open", async () => {
    const { getUserMock } = currentSupabaseMocks();
    getUserMock.mockResolvedValue({ data: { user: null } });
    const btn = {
      tagName: "DIV",
      dataset: { smoothr: "account-access" },
      closest: vi.fn(() => btn),
    };

    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    elements.push(btn);
    mutationCallback();
    expect(docClickHandler).toBeTypeOf("function");

    await docClickHandler({ target: btn, preventDefault: () => {} });
    await flushPromises();
    expect(global.document.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(global.window.dispatchEvent).toHaveBeenCalledTimes(1);
    const docEvt = global.document.dispatchEvent.mock.calls[0][0];
    const winEvt = global.window.dispatchEvent.mock.calls[0][0];
    expect(docEvt.type).toBe("smoothr:auth:open");
    expect(winEvt.type).toBe("smoothr:auth:open");
    expect(docEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
    expect(winEvt.detail.targetSelector).toBe('[data-smoothr="auth-pop-up"]');
  });

  it("binds newly added sign-out elements and dispatches sign-out", async () => {
    let handler;
    const el = {
      tagName: "DIV",
      dataset: { smoothr: "sign-out" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "sign-out" : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") handler = cb;
      }),
      click: () => handler?.({ preventDefault: () => {}, target: el }),
    };

    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    elements.push(el);
    mutationCallback();
    expect(el.addEventListener).toHaveBeenCalled();

    const fired = [];
    const listeners = {};
    window.location.assign = vi.fn();
    window.addEventListener.mockImplementation((evt, cb) => {
      (listeners[evt] ||= []).push(cb);
    });
    window.dispatchEvent.mockImplementation((evt) => {
      (listeners[evt.type] || []).forEach((cb) => cb(evt));
      return true;
    });
    window.addEventListener("smoothr:sign-out", () => fired.push(true));

    el.click();
    await flushPromises();
    expect(fired.length).toBeGreaterThan(0);
  });
});
