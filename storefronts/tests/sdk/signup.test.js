// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, vi, beforeEach } from "vitest";
import { JSDOM } from "jsdom";

let signUpMock;
let getUserMock;
let createClientMock;
let getSessionMock;

function setupSupabaseMock() {
  signUpMock = vi.fn();
  getUserMock = vi.fn(() => Promise.resolve({ data: { user: null } }));
  getSessionMock = vi.fn(() =>
    Promise.resolve({ data: { session: {} }, error: null })
  );
  createClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signUp: signUpMock,
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: getSessionMock,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  }));
  vi.doMock("@supabase/supabase-js", () => ({
    createClient: createClientMock,
  }));
}

let auth;
const config = { storeId: "00000000-0000-0000-0000-000000000000" };

function flushPromises() {
  return new Promise(setImmediate);
}

it('routes dynamic sign-up DIV click via capture fallback when auth-form is DIV', async () => {
  vi.resetModules();
  setupSupabaseMock();
  const auth = await import("../../features/auth/index.js");
  await auth.init({ supabase: createClientMock() });
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
  setupSupabaseMock();
  const { init, resolveSupabase, bindAuthElements } = await import("../../features/auth/index.js");
  await init({ supabase: createClientMock() });
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

  beforeEach(async () => {
    vi.resetModules();
    delete globalThis["__supabaseAuthClientsmoothr-browser-client"];
    setupSupabaseMock();
    signUpMock.mockClear();
    getUserMock.mockClear();
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
    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        if (evt === "DOMContentLoaded") cb();
      }),
      querySelectorAll: vi.fn((sel) => {
        if (sel.includes('[data-smoothr="sign-up"]')) return [btn];
        if (sel.includes('[data-smoothr="auth-form"]')) return [form];
        return [];
      }),
      dispatchEvent: vi.fn(),
    };
    global.document.dispatchEvent.mockClear();
    auth = await import("../../features/auth/index.js");
    vi.spyOn(auth, "lookupRedirectUrl").mockResolvedValue("/redirect");
  });

  it("signs up and redirects on success", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init({ supabase: createClientMock() });
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
    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.document.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'smoothr:auth:error' }));
    expect(global.window.location.href).toBe("");
  });

  it("validates email and password", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    await auth.init({ supabase: createClientMock() });
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
    await auth.init({ supabase: createClientMock() });
    await flushPromises();
    global.document.dispatchEvent.mockClear();
    await clickHandler({ preventDefault: () => {} });
    await flushPromises();
    expect(global.window.Smoothr.auth.user.value).toEqual(user);
    await global.window.Smoothr.auth.client.auth.getSession();
    expect(getSessionMock).toHaveBeenCalled();
  });
});

describe('session-sync', () => {
  async function flush() { return new Promise(r => setTimeout(r, 0)); }

  beforeEach(async () => {
    vi.resetModules();
    setupSupabaseMock();
    signUpMock.mockResolvedValue({ data: { user: { id: 'u' } }, error: null });
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    const dom = new JSDOM('<!doctype html><html><body><div data-smoothr="auth-form"><input data-smoothr="email" value="a@b.com" /><input data-smoothr="password" value="Password1" /><input data-smoothr="password-confirm" value="Password1" /><button data-smoothr="sign-up"></button></div></body></html>', { url: 'https://example.com' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.CustomEvent = dom.window.CustomEvent;
    window.SMOOTHR_CONFIG = { storeId: config.storeId, __brokerBase: 'https://broker.example' };
    auth = await import('../../features/auth/index.js');
    vi.spyOn(auth, 'lookupRedirectUrl').mockResolvedValue(null);
    await auth.init({ supabase: createClientMock() });
  });

  it('posts to broker with bearer token and emits success events', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    window.fetch = global.fetch = fetchSpy;
    const order = [];
    document.addEventListener('smoothr:auth:signedin', () => order.push('signedin'));
    document.addEventListener('smoothr:auth:close', () => order.push('close'));
    document.addEventListener('smoothr:auth:error', () => order.push('error'));
    document.querySelector('[data-smoothr="sign-up"]').click();
    await flush();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://broker.example/api/auth/session-sync',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer tok' })
      })
    );
    expect(order).toEqual(['signedin', 'close']);
  });

  it('emits auth:error when session-sync fails', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    window.fetch = global.fetch = fetchSpy;
    const order = [];
    document.addEventListener('smoothr:auth:signedin', () => order.push('signedin'));
    document.addEventListener('smoothr:auth:close', () => order.push('close'));
    document.addEventListener('smoothr:auth:error', () => order.push('error'));
    document.querySelector('[data-smoothr="sign-up"]').click();
    await flush();
    expect(order).toEqual(['error']);
  });
});
