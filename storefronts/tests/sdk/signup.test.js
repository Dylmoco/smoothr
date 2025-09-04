// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDomStub } from "../utils/dom-stub";
import { __setSupabaseReadyForTests } from "../../smoothr-sdk.mjs";
import { buildSupabaseMock } from "../utils/supabase-mock";

let signUpMock, getSessionMock, client;

function resetSupabase() {
  const m = buildSupabaseMock();
  client = m.client;
  signUpMock = m.mocks.signUp;
  getSessionMock = m.mocks.getSession;
  __setSupabaseReadyForTests(client);
}

beforeEach(() => {
  resetSupabase();
});

afterEach(() => {
  vi.restoreAllMocks();
});

let auth;
const config = { storeId: "00000000-0000-0000-0000-000000000000" };

function flushPromises() {
  return new Promise(setImmediate);
}

it('routes dynamic sign-up DIV click via capture fallback when auth-form is DIV', async () => {
  vi.resetModules();
  resetSupabase();
  const auth = await import("../../features/auth/index.js");
  await auth.init({ supabase: client });
  await flushPromises();

  const div = document.createElement('div');
  div.setAttribute('data-smoothr', 'auth-form');
  div.innerHTML = `
    <input data-smoothr="email" value="new@example.com" />
    <input data-smoothr="password" value="LongerPass9" />
    <input data-smoothr="password-confirm" value="LongerPass9" />
  `;
  document.body.appendChild(div);
  const signup = document.createElement('div');
  signup.setAttribute('data-smoothr', 'sign-up');
  div.appendChild(signup);

  const supa = await auth.resolveSupabase?.();
  const signUpSpy = vi.spyOn(supa.auth, 'signUp').mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });

  signup.click();
  await flushPromises();

  expect(signUpSpy).toHaveBeenCalledTimes(1);
});

it('does not double-handle sign-up clicks (direct binding vs capture fallback)', async () => {
  vi.resetModules();
  resetSupabase();
  const { init, resolveSupabase, bindAuthElements } = await import("../../features/auth/index.js");
  await init({ supabase: client });
  await flushPromises();

  const container = document.createElement('div');
  container.setAttribute('data-smoothr', 'auth-form');
  container.innerHTML = `
    <input data-smoothr="email" value="unique@example.com" />
    <input data-smoothr="password" value="Password123" />
    <input data-smoothr="password-confirm" value="Password123" />
    <div data-smoothr="sign-up"></div>
  `;
  document.body.appendChild(container);

  // Force binding (bindAuthElements marks __smoothrAuthBound and attaches direct listener)
  bindAuthElements(container);

  const supa = await resolveSupabase?.();
  const signUpSpy = vi.spyOn(supa.auth, 'signUp')
    .mockResolvedValue({ data: { user: { id: 'u-signup' } }, error: null });

  const trigger = container.querySelector('[data-smoothr="sign-up"]');
  trigger.click();
  await flushPromises();

  expect(signUpSpy).toHaveBeenCalledTimes(1);
});

describe("signup flow", () => {
  let clickHandler;
  let emailValue;
  let passwordValue;
  let confirmValue;
  let realDocument;

  beforeEach(async () => {
    vi.resetModules();
    delete globalThis["__supabaseAuthClientsmoothr-browser-client"];
    resetSupabase();
    signUpMock.mockClear();
    getSessionMock.mockClear();
    emailValue = "test@example.com";
    passwordValue = "Password1";
    confirmValue = "Password1";
    clickHandler = undefined;
    let btn;
    const form = {
      dataset: { smoothr: "auth-form" },
      querySelector: vi.fn((selector) => {
        if (selector === '[data-smoothr="email"]') return { value: emailValue };
        if (selector === '[data-smoothr="password"]')
          return { value: passwordValue };
        if (selector === '[data-smoothr="password-confirm"]')
          return { value: confirmValue };
        if (selector === '[data-smoothr="sign-up"]') return btn;
        return null;
      }),
    };
    btn = {
      tagName: "DIV",
      dataset: { smoothr: "sign-up" },
      getAttribute: (attr) => (attr === "data-smoothr" ? "sign-up" : null),
      addEventListener: vi.fn((ev, cb) => {
        if (ev === "click") clickHandler = cb;
      }),
      closest: vi.fn(() => form),
    };

    global.window = {
      location: { href: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      SMOOTHR_CONFIG: { storeId: config.storeId },
    };
    realDocument = global.document;
    global.document = createDomStub({
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((sel) => {
        if (sel.includes('[data-smoothr="sign-up"]')) return [btn];
        if (sel.includes('[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
      dispatchEvent: vi.fn(),
    });
    global.document.dispatchEvent.mockClear();
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  afterEach(() => {
    global.document = realDocument;
  });

  it("signs up and redirects on success", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init({ supabase: client });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(signUpMock).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "Password1",
      options: { data: { store_id: config.storeId } },
    });
    expect(global.document.dispatchEvent).toHaveBeenCalled();
  });

  it("does nothing on signup failure", async () => {
    signUpMock.mockResolvedValue({ data: null, error: new Error("bad") });
    await auth.init({ supabase: client });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.document.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'smoothr:auth:error' }));
    expect(global.window.location.href).toBe("");
  });

  it("validates email and password", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init({ supabase: client });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    emailValue = "bademail";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    signUpMock.mockClear();
    passwordValue = "short";
    emailValue = "user@example.com";
    confirmValue = "short";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    signUpMock.mockClear();
    passwordValue = "Password1";
    confirmValue = "Mismatch";
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
  });

  it("sets window.Smoothr.auth.user on success", async () => {
    const user = { id: "1" };
    signUpMock.mockResolvedValue({ data: { user }, error: null });
    await auth.init({ supabase: client });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    await global.window.Smoothr.auth.client.auth.getSession();
    expect(getSessionMock).toHaveBeenCalled();
  });
});

describe('sessionSync transport', () => {
  async function flush() {
    return new Promise(r => setTimeout(r, 0));
  }

  beforeEach(async () => {
    vi.resetModules();
    resetSupabase();
    signUpMock.mockResolvedValue({ data: { user: { id: 'u' } }, error: null });
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    document.body.innerHTML = '';
    window.history.replaceState(null, '', 'https://example.com/');
    window.SMOOTHR_CONFIG = { storeId: config.storeId };
    auth = await import('../../features/auth/index.js');
    vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue(null);
    await auth.init({ supabase: client });
  });

  it('uses form transport when redirect configured', async () => {
    window.SMOOTHR_CONFIG.sign_in_redirect_url = '/';
    document.body.innerHTML = `<div data-smoothr="auth-form">
        <input data-smoothr="email" value="a@b.com" />
        <input data-smoothr="password" value="Password1" />
        <input data-smoothr="password-confirm" value="Password1" />
        <button data-smoothr="sign-up"></button>
      </div>`;
    const trigger = document.querySelector('[data-smoothr="sign-up"]');
    const order = [];
    document.addEventListener('smoothr:auth:signedin', () => order.push('signedin'));
    document.addEventListener('smoothr:auth:close', () => order.push('close'));
    const submitSpy = vi.fn();
    const inputs = [];
    let formObj = null;
    const origCreate = document.createElement.bind(document);
    document.createElement = vi.fn((tag) => {
      if (tag === 'form') {
        formObj = {
          method: '',
          enctype: '',
          action: '',
          style: {},
          appendChild: (el) => inputs.push(el),
          submit: submitSpy,
        };
        return formObj;
      }
      if (tag === 'input') {
        const input = { type: '', name: '', value: '' };
        return input;
      }
      return origCreate(tag);
    });
    document.body.appendChild = vi.fn();
    window.fetch = vi.fn();
    trigger.click();
    await flush();
    expect(window.fetch).not.toHaveBeenCalled();
    expect(formObj?.method).toBe('POST');
    expect(formObj?.enctype).toBe('application/x-www-form-urlencoded');
    expect(formObj?.action.endsWith('/api/auth/session-sync')).toBe(true);
    expect(inputs.some(i => i.name === 'store_id' && i.value === config.storeId)).toBe(true);
    expect(inputs.some(i => i.name === 'access_token' && i.value === 'tok')).toBe(true);
    expect(submitSpy).toHaveBeenCalled();
    expect(order).toEqual(['signedin', 'close']);
    document.createElement = origCreate;
  });

  it('uses XHR when no redirect configured', async () => {
    window.SMOOTHR_CONFIG.sign_in_redirect_url = null;
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    window.fetch = global.fetch = fetchSpy;
    const initialHref = window.location.href;
    document.body.innerHTML = `<div data-smoothr="auth-form">
        <input data-smoothr="email" value="a@b.com" />
        <input data-smoothr="password" value="Password1" />
        <input data-smoothr="password-confirm" value="Password1" />
        <button data-smoothr="sign-up"></button>
      </div>`;
    const trigger = document.querySelector('[data-smoothr="sign-up"]');
    const order = [];
    document.addEventListener('smoothr:auth:signedin', () => order.push('signedin'));
    document.addEventListener('smoothr:auth:close', () => order.push('close'));
    const createSpy = vi.spyOn(document, 'createElement');
    trigger.click();
    await flush();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(createSpy.mock.calls.some(c => c[0] === 'form')).toBe(false);
    expect(order).toEqual(['signedin', 'close']);
    expect(window.location.href).toBe(initialHref);
    createSpy.mockRestore();
  });

  it('override forces form transport', async () => {
    window.SMOOTHR_CONFIG.sign_in_redirect_url = null;
    window.SMOOTHR_CONFIG.forceFormRedirect = true;
    document.body.innerHTML = `<div data-smoothr="auth-form">
        <input data-smoothr="email" value="a@b.com" />
        <input data-smoothr="password" value="Password1" />
        <input data-smoothr="password-confirm" value="Password1" />
        <button data-smoothr="sign-up"></button>
      </div>`;
    const trigger = document.querySelector('[data-smoothr="sign-up"]');
    const submitSpy = vi.fn();
    const inputs = [];
    let formObj = null;
    const origCreate = document.createElement.bind(document);
    document.createElement = vi.fn((tag) => {
      if (tag === 'form') {
        formObj = {
          method: '',
          enctype: '',
          action: '',
          style: {},
          appendChild: (el) => inputs.push(el),
          submit: submitSpy,
        };
        return formObj;
      }
      if (tag === 'input') {
        const input = { type: '', name: '', value: '' };
        return input;
      }
      return origCreate(tag);
    });
    document.body.appendChild = vi.fn();
    window.fetch = vi.fn();
    trigger.click();
    await flush();
    expect(window.fetch).not.toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalled();
    expect(formObj?.method).toBe('POST');
    document.createElement = origCreate;
  });
});
