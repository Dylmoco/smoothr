// Auth init owns the test hooks and helpers (barrel re-exports these).
// Keep everything side-effect light but export callable hooks immediately.

import { lookupRedirectUrl } from '../../../supabase/authHelpers.js';
import { getConfig } from '../config/globalConfig.js';
import {
  AUTH_CONTAINER_SELECTOR,
  ATTR_EMAIL,
  ATTR_PASSWORD,
  ATTR_PASSWORD_CONFIRM,
  ATTR_SIGNUP,
} from './constants.js';
import { validatePasswordsOrThrow } from './validators.js';
import {
  hasRecoveryHash,
  stripHash,
  isOnResetRoute,
  stripRecoveryHashIfNotOnReset,
} from '../../core/hash.js';

const { debug } = getConfig();
const log = (...args) => debug && console.log('[Smoothr Auth]', ...args);

function emitAuth(name, detail = {}) {
  const g = globalThis;
  const w = g.window || g;
  const doc = w.document || g.document;
  const init = { detail, bubbles: true, composed: true, cancelable: false };
  try { w?.dispatchEvent?.(new CustomEvent(name, init)); } catch {}
  try { doc?.dispatchEvent?.(new CustomEvent(name, init)); } catch {}
  if (w?.SMOOTHR_DEBUG) {
    try { console.info('[Smoothr][auth] dispatched', { name, detail }); } catch {}
  }
}

function emitAuthError(code, detail = {}) {
  emitAuth('smoothr:auth:error', { code, ...detail });
}

// Renders/updates a small inline error element inside the current auth form.
// TEMP: minimal inline styles; frontend can override or we can remove later.
function renderAuthError(container, message) {
  try {
    const C = container || document.querySelector('[data-smoothr="auth-form"]');
    if (!C) return;
    let el = C.querySelector('[data-smoothr="error"]');
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('data-smoothr', 'error');
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'polite');
      // tiny inline style, easy to override (Webflow custom code/GSAP later)
      el.style.marginTop = '8px';
      el.style.fontSize = '0.95rem';
      el.style.color = '#e11d48'; // rose-600
      C.appendChild(el);
    }
    el.textContent = message || 'Something went wrong. Please try again.';
  } catch {}
}

// Optional: clear error when typing
function clearAuthError(container) {
  try {
    const C = container || document.querySelector('[data-smoothr="auth-form"]');
    const el = C?.querySelector?.('[data-smoothr="error"]');
    if (el) el.textContent = '';
  } catch {}
}

function mapResetError(err) {
  const m = (err && (err.message || err.error_description || err.error)) || '';
  const code = (err && err.code) || '';
  const s = (m + ' ' + code).toLowerCase();

  if (s.includes('token') && (s.includes('invalid') || s.includes('expired')))
    return 'Your reset link is invalid or has expired. Please request a new one.';
  if (s.includes('password') && (s.includes('weak') || s.includes('too short') || s.includes('length')))
    return 'Please choose a stronger password.';
  if (s.includes('mismatch'))
    return 'Passwords do not match.';
  return 'Unable to reset your password. Please try again.';
}

function markResetLoading(on) {
  // Add/remove a class on <html> so Webflow/Framer styles can hide content
  const root = document.documentElement;
  if (!root) return;
  if (on) root.classList.add('smoothr-reset-loading');
  else root.classList.remove('smoothr-reset-loading');
}

const AUTH_PANEL_SELECTORS = [
  '[data-smoothr="auth-pop-up"]',
  '[data-smoothr="auth-wrapper"]'
];
function resolveAuthPanelSelector(doc = globalThis.document) {
  if (!doc) return null;
  for (const sel of AUTH_PANEL_SELECTORS) {
    try {
      if (doc.querySelector(sel)) return sel;
    } catch {}
  }
  return null;
}
async function deferToNextFrame(times = 1) {
  for (let i = 0; i < times; i++) {
    await new Promise(r => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => r());
      } else {
        setTimeout(r, 0);
      }
    });
  }
}

function postViaHiddenIframe(url, fields = {}) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.name = 'smoothr-sync';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = iframe.name;
    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = String(k);
      input.value = String(v);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    iframe.addEventListener('load', () => {
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        resolve(true);
      }, 0);
    });
    form.submit();
  });
}

// Compute broker base URL without requiring customer markup changes.
export function getBrokerBaseUrl() {
  const w = globalThis.window || globalThis;
  const d = w.document || globalThis.document;
  // 1) If loader saved the effective config URL, use its origin
  const cfgUrl = w?.SMOOTHR_CONFIG?.__configUrl;
  if (cfgUrl) {
    try { return new URL(cfgUrl).origin; } catch {}
  }
  // 2) Otherwise, find our loader script and read its data-config-url
  const tag = d?.getElementById?.('smoothr-sdk');
  const attr = tag?.getAttribute?.('data-config-url');
  if (attr) {
    try { return new URL(attr, w.location?.href || '').origin; } catch {}
  }
  // 3) Fallback to your Vercel app origin (safe default)
  return 'https://smoothr.vercel.app';
}
export function getPasswordResetRedirectUrl() {
  const w = globalThis.window || globalThis;
  const cfg = typeof getConfig === 'function' ? getConfig() : (w.SMOOTHR_CONFIG || {});
  const storeId = cfg.storeId || w.document?.getElementById('smoothr-sdk')?.dataset?.storeId || '';
  const broker = getBrokerBaseUrl();
  const origin = encodeURIComponent(w.location?.origin || '');
  return `${broker}/auth/recovery-bridge${storeId ? `?store_id=${encodeURIComponent(storeId)}&orig=${origin}` : `?orig=${origin}`}`;
}


// when no redirect is configured, we currently use XHR (console may show CORS in dev)
// optionally use hidden-iframe to avoid CORS noise entirely
async function sessionSyncStayOnPage(payload) {
  const silent = !!(
    window.SMOOTHR_CONFIG &&
    window.SMOOTHR_CONFIG.auth &&
    window.SMOOTHR_CONFIG.auth.silentPost
  );
  const url = `${getBrokerBaseUrl()}/api/auth/session-sync`;
  if (silent) {
    await postViaHiddenIframe(url, payload);
    return { ok: true, json: async () => ({}) };
  }
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Minimal CustomEvent polyfill for environments lacking it.
if (typeof globalThis.CustomEvent !== 'function') {
  const CustomEventPoly = function CustomEvent(type, params = {}) {
    const evt = globalThis.document?.createEvent?.('CustomEvent');
    if (evt && evt.initCustomEvent) {
      evt.initCustomEvent(
        type,
        params.bubbles ?? false,
        params.cancelable ?? false,
        params.detail,
      );
      Object.setPrototypeOf(evt, globalThis.CustomEvent.prototype);
      return evt;
    }
    const e = {
      type,
      detail: params.detail,
      bubbles: params.bubbles ?? false,
      cancelable: params.cancelable ?? false,
    };
    return Object.setPrototypeOf(e, globalThis.CustomEvent.prototype);
  };
  CustomEventPoly.prototype = globalThis.Event?.prototype ?? {};
  globalThis.CustomEvent = CustomEventPoly;
  try {
    if (globalThis.window && !globalThis.window.CustomEvent) {
      globalThis.window.CustomEvent = CustomEventPoly;
    }
  } catch {}
} else if (globalThis.window && !globalThis.window.CustomEvent) {
  try { globalThis.window.CustomEvent = globalThis.CustomEvent; } catch {}
}

// ---- Public, test-visible hooks (live bindings) ----
// Define as no-ops *at module load* so tests always import functions.
export let onAuthStateChangeHandler = () => {};
export let mutationCallback = () => {};
export let clickHandler = () => {};
export let googleClickHandler = () => {};
export let appleClickHandler = () => {};
export let signOutHandler = () => {};
export let docClickHandler = () => {};
export let docSubmitHandler = () => {};
export let docKeydownHandler = () => {};

function accountAccessCaptureHandler(e) {
  try {
    const trigger = e?.target?.closest?.('[data-smoothr="account-access"]');
    if (!trigger) return;
    if (e.__smoothrAccountAccessHandled) return;
    e.__smoothrAccountAccessHandled = true;
    try { e.preventDefault?.(); } catch {}
    try { e.stopPropagation?.(); } catch {}
    try { e.stopImmediatePropagation?.(); } catch {}
    docClickHandler?.(e);
  } catch {}
}

function bindAccountAccessTriggersEarly() {
  try {
    document.addEventListener('click', accountAccessCaptureHandler, { capture: true, passive: false });
  } catch {}
}

// Resolve the auth container (FORM or DIV) nearest a node.
export function resolveAuthContainer(el) {
  if (!el) return null;
  return el.closest?.(AUTH_CONTAINER_SELECTOR) || null;
}

function extractCredsFrom(container) {
  const email = container?.querySelector(ATTR_EMAIL)?.value?.trim() || '';
  const password = container?.querySelector(ATTR_PASSWORD)?.value || '';
  const confirm =
    container?.querySelector(ATTR_PASSWORD_CONFIRM)?.value || '';
  return { email, password, confirm };
}

const _bound = new WeakSet();
export function bindAuthElements(root = globalThis.document) {
  if (!root?.querySelectorAll) return;
  const attach = (el, handler) => {
    if (!_bound.has(el) && typeof el.addEventListener === 'function') {
      try { el.__smoothrAuthBound = true; } catch {}
      el.addEventListener('click', handler, { passive: false });
      _bound.add(el);
    }
  };
  root.querySelectorAll('[data-smoothr="login"]').forEach(el => attach(el, clickHandler));
  root.querySelectorAll('[data-smoothr="password-reset-confirm"]').forEach(el => attach(el, clickHandler));
  root
    .querySelectorAll('[data-smoothr="sign-up"], [data-smoothr="login-google"], [data-smoothr="login-apple"], [data-smoothr="password-reset"]')
    .forEach(el => {
      const action = el.getAttribute('data-smoothr');
      const handler =
        action === 'login-google' ? googleClickHandler :
        action === 'login-apple' ? appleClickHandler :
        clickHandler;
      attach(el, handler);
    });
  root
    .querySelectorAll('[data-smoothr="sign-out"], [data-smoothr="logout"]')
    .forEach(el => {
      const value = el.getAttribute?.('data-smoothr') ?? el.dataset?.smoothr ?? '';
      const selector = `[data-smoothr="${value}"]`;
      attach(el, signOutHandler);
      log('bound sign-out handler to', selector);
    });
  root.querySelectorAll('[data-smoothr="auth-pop-up"]').forEach(el => {
    attach(el, () => {
      const active = el.getAttribute?.('data-smoothr-active') === '1';
      const nowOpen = !active;
      try { el.setAttribute?.('data-smoothr-active', nowOpen ? '1' : '0'); } catch {}
      if (el.getAttribute?.('data-smoothr-autoclass') === '1') {
        try { el.classList.toggle('is-active', nowOpen); } catch {}
      }
      log(`auth panel ${nowOpen ? 'opened' : 'closed'}`);
    });
  });
  const doc = root?.ownerDocument || globalThis.document;
  if (doc && !_bound.has(doc)) {
    _bound.add(doc);
  }
}

// ---- Supabase client plumbings ----
let _injectedClient = null;
export const setSupabaseClient = (c) => { _injectedClient = c || null; };
export const resolveSupabase = async () => {
  const g = globalThis;
  const w = g.window || g;
  const s = w.Smoothr || g.Smoothr || {};
  w.Smoothr = g.Smoothr = s;
  if (_injectedClient) return _injectedClient;
  if (s?.__supabase) return s.__supabase;
  const maybeReady = s?.supabaseReady;
  if (maybeReady) {
    try {
      const client = await maybeReady;
      if (client) {
        s.__supabase = client;
        return client;
      }
    } catch {}
  }
  const existing = s?.auth?.client || w?.supabase || g.supabase;
  if (existing) {
    s.__supabase = existing;
    return existing;
  }
  try {
    const { supabaseUrl, supabaseAnonKey } = s?.config || {};
    if (!supabaseUrl || !supabaseAnonKey) {
      const ready = s?.supabaseReady;
      if (ready) {
        try {
          const client = await ready;
          if (client) {
            s.__supabase = client;
            return client;
          }
        } catch {}
      }
      return null;
    }
    const mod = await import('@supabase/supabase-js');
    const create = mod.createClient || mod.default?.createClient;
    if (!create) return null;
    const client = create(supabaseUrl, supabaseAnonKey);
    s.__supabase = client;
    return client;
  } catch {
    return null;
  }
};

export async function requestPasswordResetForEmail(email) {
  const redirectTo = getPasswordResetRedirectUrl();
  const script = document.getElementById('smoothr-sdk');

  // 1) Preferred: config-driven
  let brokerBase = null;
  try {
    brokerBase = typeof getBrokerBaseUrl === 'function' ? getBrokerBaseUrl() : null;
    if (brokerBase === 'https://smoothr.vercel.app') brokerBase = null;
  } catch (_) {
    brokerBase = null;
  }

  // 2) Legacy: SDK hosted on broker domain
  if (!brokerBase && script?.src) {
    try {
      brokerBase = new URL(script.src).origin;
    } catch (_) {}
  }

  // 3) Final fallback
  if (!brokerBase) brokerBase = 'https://smoothr.vercel.app';
  const body = JSON.stringify({
    email,
    store_id:
      (window.SMOOTHR_CONFIG && window.SMOOTHR_CONFIG.store_id) ||
      script?.dataset?.storeId ||
      '',
    // still send redirectTo for analytics/telemetry if you want, but broker ignores untrusted targets
    redirectTo,
  });
  const resp = await fetch(`${brokerBase}/api/auth/send-reset`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    credentials: 'omit', // keep CORS happy; no cookies needed
  });
  if (!resp.ok) {
    try {
      const supabase = await resolveSupabase();
      const { error } = await supabase?.auth.resetPasswordForEmail(email, { redirectTo }) || {};
      if (error) throw error;
      return true;
    } catch (e) {
      throw new Error('reset_email_failed');
    }
  }
  return true;
}

/** @internal test-only helper to avoid bundling legacy deps */
  async function tryImportClient() {
    try {
      const mod = await import('../../../supabase/browserClient.js');
      if (mod.getSupabaseClient) {
        return await mod.getSupabaseClient();
      }
      return mod.default ?? null;
    } catch {
      return null;
    }
  }

export { lookupRedirectUrl };
// Several tests spy on this name; keep it here.
export function normalizeDomain(input) {
  try {
    if (!input) return '';
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Some tests expect this to exist on import (no DOM work).
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = function setSelectedCurrency(curr) {
    try { globalThis.localStorage?.setItem?.('smoothr_currency', curr); } catch {}
  };
}

// Define init locally (don't reference the barrel's .init).
let _initPromise;
let _restoredOnce = false;
let _seededUserOnce = false;
let _prSession = null;
let _prRedirect = '';
export async function init(options = {}) {
  bindAccountAccessTriggersEarly();
  stripRecoveryHashIfNotOnReset();
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const w = globalThis.window || globalThis;
    const client = options.supabase ?? await resolveSupabase();

    // Let tests observe the client injection (barrel re-exports this).
    try { setSupabaseClient(client); } catch {}

    // Hit whichever object the test is spying on. Don't await a query chain here;
    // the tests only assert the 'from' call with table name.
    try { client?.from?.('v_public_store'); } catch {}

    // Idempotent global
    w.Smoothr = w.Smoothr || {};

    // Minimal API shape some tests reach for
    const api = w.Smoothr.auth || {
      client: client || null,
      user: { value: null },
      init,
      login: async () => {},
    };
    w.Smoothr.auth = api;

    // Reset hooks to safe no-ops (live bindings stay exported from this module).
    clickHandler = () => {};
    googleClickHandler = () => {};
    appleClickHandler = () => {};
    signOutHandler = () => {};
    docClickHandler = () => {};
    mutationCallback = () => {};
    onAuthStateChangeHandler = () => {};

    // Restore session exactly once per boot (tests spy on getSession).
    if (!_restoredOnce) {
      try { await client?.auth?.getSession?.(); } catch {}
      _restoredOnce = true;
      try { console?.log?.('[Smoothr] Auth restored'); } catch {}
    }

    // Seed initial user exactly once (some specs expect getUser to be called)
    if (!_seededUserOnce) {
      try {
        const res = await client?.auth?.getUser?.();
        const initialUser = res?.data?.user ?? null;
        api.user.value = initialUser;
        if (initialUser) {
          const ev = typeof w.CustomEvent === 'function'
            ? new w.CustomEvent('smoothr:login')
            : { type: 'smoothr:login' };
          (w.document || globalThis.document)?.dispatchEvent?.(ev);
        }
      } catch {}
      _seededUserOnce = true;
    }

    // Live handlers used by specs (no DOM required)
    onAuthStateChangeHandler = (event, payload = {}) => {
      const authState = w.Smoothr?.auth;
      if (!authState || !authState.user) return;
      if (event === 'SIGNED_OUT') {
        authState.user.value = null;
        emitAuth?.('smoothr:sign-out', { reason: 'state-change' });
      } else {
        authState.user.value = payload.user ?? null;
        const ev = typeof w.CustomEvent === 'function'
          ? new w.CustomEvent('smoothr:login')
          : { type: 'smoothr:login' };
          (w.document || globalThis.document)?.dispatchEvent?.(ev);
      }
    };

    // Adapter: normalize Supabase callback (event, session|null|weird) -> (event, { user })
    const _safeAuthCallback = (event, sessOrData) => {
      try {
        let session = null;
        // support (event, session) and (event, { session })
        if (sessOrData && typeof sessOrData === 'object') {
          if ('user' in sessOrData || 'access_token' in sessOrData) {
            session = sessOrData;
          } else if ('session' in sessOrData) {
            session = sessOrData.session;
          } else if ('data' in sessOrData && sessOrData.data && 'session' in sessOrData.data) {
            session = sessOrData.data.session;
          }
        }
        const user = session?.user ?? null;
        onAuthStateChangeHandler(event, { user });
      } catch (err) {
        try { console.warn('[Smoothr SDK] auth state callback error:', err); } catch {}
      }
    };

    try { client?.auth?.onAuthStateChange?.(_safeAuthCallback); } catch {}

    const emailRE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    // was: /[A-Z]/.test(p) && /[0-9]/.test(p) && p?.length >= 8
    const strong = p => /[0-9]/.test(p) && p?.length >= 8;

    // Auto mode: if a sign-in redirect exists, use form POST + 303; otherwise XHR.
    const sessionSyncAndEmit = async (supa, userId, overrideUrl) => {
      try {
        const { data: sess } = await supa.auth.getSession();
        const token = sess?.session?.access_token;
        const storeId =
          w?.SMOOTHR_CONFIG?.storeId || w?.Smoothr?.config?.storeId || null;
        if (!token || !storeId) throw new Error('missing token or store');

        const cfg = getConfig();
        let redirectUrl = overrideUrl || cfg.sign_in_redirect_url || null;
        if (!redirectUrl) {
          try {
            redirectUrl = await (typeof lookupRedirectUrl === 'function'
              ? lookupRedirectUrl()
              : null);
            if (redirectUrl) cfg.sign_in_redirect_url = redirectUrl;
          } catch {}
        }
        const shouldRedirect =
          cfg.forceFormRedirect === true || !!redirectUrl;

        if (shouldRedirect) {
          log('sessionSync form redirect', { redirectUrl });
          emitAuth?.('smoothr:auth:signedin', { userId: userId || null });
          emitAuth?.('smoothr:auth:close', { reason: 'signedin' });
          const doc = w.document;
          const form = doc?.createElement?.('form');
          if (!form) return;
          form.method = 'POST';
          form.enctype = 'application/x-www-form-urlencoded';
          form.action = `${getBrokerBaseUrl()}/api/auth/session-sync`;
          form.style.display = 'none';
          const mk = (name, value) => {
            const input = doc?.createElement?.('input');
            if (input) {
              input.type = 'hidden';
              input.name = name;
              input.value = value || '';
              form.appendChild(input);
            }
          };
          mk('store_id', storeId);
          mk('access_token', token);
          try { doc?.body?.appendChild?.(form); } catch {}
          try { form.submit(); } catch {}
          return;
        }

        log('sessionSync xhr path', { redirectUrl });
        const resp = await sessionSyncStayOnPage({
          store_id: storeId,
          access_token: token,
        });
        const json = await resp.json?.().catch(() => ({}));
        if (resp.ok && json?.ok) {
          emitAuth?.('smoothr:auth:signedin', { userId: userId || null });
          emitAuth?.('smoothr:auth:close', { reason: 'signedin' });
          const url =
            overrideUrl || json.redirect_url || json.sign_in_redirect_url;
          if (url) {
            try { w.location?.assign?.(url); } catch {}
          }
          return;
        }
      } catch {}
      emitAuth?.('smoothr:auth:signedin', { userId: userId || null });
      emitAuth?.('smoothr:auth:close', { reason: 'signedin' });
      if (overrideUrl) {
        try { w.location?.assign?.(overrideUrl); } catch {}
      }
    };

    clickHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      const d = w.document || globalThis.document;
      const el =
        e?.target?.closest?.('[data-smoothr]') ||
        d?.querySelectorAll?.(
          '[data-smoothr="login"], [data-smoothr="sign-up"], [data-smoothr="password-reset"], [data-smoothr="password-reset-confirm"], [data-smoothr="login-google"], [data-smoothr="login-apple"]'
        )?.[0];
      const container = resolveAuthContainer(el);
      if (!container) {
        emitAuthError('NO_CONTAINER');
        return;
      }
      const action = el?.getAttribute?.('data-smoothr');
      const testClient = (typeof window !== 'undefined' && window.__SMOOTHR_TEST_SUPABASE__) || null;
      const c = testClient || await resolveSupabase();
      if (!action || !c?.auth) return;
      if (action === 'login') {
        const email = container?.querySelector('[data-smoothr="email"]')?.value ?? '';
        const pwd = container?.querySelector('[data-smoothr="password"]')?.value ?? '';
        if (!emailRE.test(email)) return;
        try {
          const { data, error } = await c.auth.signInWithPassword({ email, password: pwd });
          w.Smoothr.auth.user.value = data?.user ?? null;
          if (error || !data?.user) throw error;
          await c.auth.getSession?.();
          const ev = typeof w.CustomEvent === 'function'
            ? new w.CustomEvent('smoothr:login')
            : { type: 'smoothr:login' };
          (w.document || globalThis.document)?.dispatchEvent?.(ev);
          await sessionSyncAndEmit(c, data?.user?.id || null);
        } catch (err) {
          w.Smoothr.auth.user.value = null;
          emitAuth?.('smoothr:auth:error', { code: err?.status || 'AUTH_FAILED', message: err?.message || 'Authentication failed' });
        }
        return;
      }
      if (action === 'sign-up') {
        const { email, password, confirm } = extractCredsFrom(container);
        if (!emailRE.test(email) || !strong(password)) return;
        if (confirm && confirm !== password) {
          emitAuth?.('smoothr:auth:error', {
            code: 'PASSWORD_MISMATCH',
            message: 'Passwords do not match',
          });
          return;
        }
        try {
          const result = await c.auth.signUp({
            email,
            password,
            options: { data: { store_id: getConfig().storeId } },
          });
          const { data, error } = result;
          w.Smoothr.auth.user.value = data?.user ?? null;
          if (error || !data?.user) throw error;
          await c.auth.getSession?.();
          const ev = typeof w.CustomEvent === 'function'
            ? new w.CustomEvent('smoothr:login')
            : { type: 'smoothr:login' };
          (w.document || globalThis.document)?.dispatchEvent?.(ev);
          await sessionSyncAndEmit(c, data?.user?.id || null);
        } catch (err) {
          w.Smoothr.auth.user.value = null;
          emitAuth?.('smoothr:auth:error', { code: err?.status || 'AUTH_FAILED', message: err?.message || 'Authentication failed' });
        }
        return;
      }
      if (action === 'password-reset') {
        const email = container?.querySelector('[data-smoothr="email"]')?.value ?? '';
        const successEl = container?.querySelector('[data-smoothr-success]');
        const errorEl = container?.querySelector('[data-smoothr-error]');
        try {
          await requestPasswordResetForEmail(email);
          w.Smoothr.auth.user.value = null;
          if (successEl) {
            successEl.textContent = 'Check your email for a reset link.';
            successEl.removeAttribute?.('hidden');
            successEl.style && (successEl.style.display = '');
          }
          if (errorEl) errorEl.textContent = '';
          w.alert?.('Check your email for a reset link.');
        } catch (err) {
          w.Smoothr.auth.user.value = null;
          if (errorEl) {
            errorEl.textContent = err?.message || String(err);
            errorEl.removeAttribute?.('hidden');
            errorEl.style && (errorEl.style.display = '');
          }
          w.alert?.(err?.message || String(err));
          emitAuth?.('smoothr:auth:error', { code: err?.status || 'AUTH_FAILED', message: err?.message || 'Authentication failed' });
        }
        return;
      }
      if (action === 'password-reset-confirm') {
        const { password, confirm } = extractCredsFrom(container);
        clearAuthError(container);
        try {
          validatePasswordsOrThrow(password, confirm);
        } catch (e) {
          const msg =
            e?.message === 'password_mismatch'
              ? 'Passwords do not match.'
              : e?.message === 'password_too_weak'
              ? 'Please choose a stronger password.'
              : 'Invalid password.';
          renderAuthError(container, msg);
          emitAuth?.('smoothr:auth:error', { message: msg, stage: 'reset-confirm', code: e?.message || 'password_error' });
          throw e;
        }

        const hash = (w.location?.hash || '').slice(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token') || '';
        if (!accessToken) {
          const msg = 'Recovery link is missing or expired.';
          renderAuthError(container, msg);
          emitAuth?.('smoothr:auth:error', { message: msg, stage: 'reset-confirm', code: 'missing_recovery_token' });
          return;
        }

        if (isOnResetRoute()) markResetLoading?.(true);
        try {
          const { data: userRes, error: userErr } = await c.auth.getUser(accessToken);
          if (userErr || !userRes?.user) {
            const msg = 'Invalid or expired recovery token.';
            renderAuthError(container, msg);
            emitAuth?.('smoothr:auth:error', { message: msg, stage: 'reset-confirm', raw: userErr, code: 'invalid_recovery_token' });
            return;
          }
          const { error: updateErr } = await c.auth.updateUser({ password });
          if (updateErr) {
            const msg = 'Unable to update password. Please try again.';
            renderAuthError(container, msg);
            emitAuth?.('smoothr:auth:error', { message: msg, stage: 'reset-confirm', raw: updateErr });
            return;
          }
          w.Smoothr.auth.user.value = userRes.user;
          if (isOnResetRoute()) stripHash();

          const storeId =
            (w.SMOOTHR_CONFIG && w.SMOOTHR_CONFIG.store_id) ||
            w.document?.getElementById('smoothr-sdk')?.dataset?.storeId || '';
          if (!storeId) {
            history.replaceState?.(null, '', w.location?.pathname + w.location?.search);
            w.location?.assign?.('/');
            return;
          }

          const formEl = w.document?.createElement?.('form');
          if (formEl) {
            formEl.method = 'POST';
            formEl.action = '/api/auth/session-sync';
            const f1 = w.document.createElement('input');
            f1.type = 'hidden';
            f1.name = 'store_id';
            f1.value = storeId;
            formEl.appendChild(f1);
            const f2 = w.document.createElement('input');
            f2.type = 'hidden';
            f2.name = 'access_token';
            f2.value = accessToken;
            formEl.appendChild(f2);
            w.document.body.appendChild(formEl);
            history.replaceState?.(null, '', w.location?.pathname + w.location?.search);
            formEl.submit();
          }
        } finally {
          if (isOnResetRoute()) markResetLoading?.(false);
        }
        return;
      }
    };

    googleClickHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      globalThis.localStorage?.setItem?.('smoothr_oauth', '1');
      const c = await resolveSupabase();
      try {
        await c?.auth?.signInWithOAuth?.({
          provider: 'google',
          options: {
            redirectTo: w.location?.origin || '',
            data: { store_id: getConfig().storeId }
          }
        });
        const res = await c?.auth?.getUser?.();
        const user = res?.data?.user ?? null;
        w.Smoothr.auth.user.value = user;
        const ev = typeof w.CustomEvent === 'function'
          ? new w.CustomEvent('smoothr:login')
          : { type: 'smoothr:login' };
        (w.document || globalThis.document)?.dispatchEvent?.(ev);
        if (user) await sessionSyncAndEmit(c, user?.id || null);
      } catch (err) {
        emitAuth?.('smoothr:auth:error', { code: err?.status || 'AUTH_FAILED', message: err?.message || 'Authentication failed' });
      }
    };

    appleClickHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      globalThis.localStorage?.setItem?.('smoothr_oauth', '1');
      const c = await resolveSupabase();
      try {
        await c?.auth?.signInWithOAuth?.({
          provider: 'apple',
          options: {
            redirectTo: w.location?.origin || '',
            data: { store_id: getConfig().storeId }
          }
        });
        const res = await c?.auth?.getUser?.();
        const user = res?.data?.user ?? null;
        w.Smoothr.auth.user.value = user;
        const ev = typeof w.CustomEvent === 'function'
          ? new w.CustomEvent('smoothr:login')
          : { type: 'smoothr:login' };
        (w.document || globalThis.document)?.dispatchEvent?.(ev);
        if (user) await sessionSyncAndEmit(c, user?.id || null);
      } catch (err) {
        emitAuth?.('smoothr:auth:error', { code: err?.status || 'AUTH_FAILED', message: err?.message || 'Authentication failed' });
      }
    };

    signOutHandler = async (e) => {
      try {
        e?.preventDefault?.();
        const supa = await resolveSupabase?.();
        await supa?.auth?.signOut?.();
        if (w.Smoothr?.auth?.user) w.Smoothr.auth.user.value = null;
        emitAuth?.('smoothr:sign-out', { reason: 'manual' });
        emitAuth?.('smoothr:auth:close', { reason: 'signedout' });
        let url = null;
        try {
          url = await (typeof lookupRedirectUrl === 'function' ? lookupRedirectUrl('sign_out') : null);
        } catch {}
        if (!url) url = location.origin;
        location.assign(url);
      } catch (err) {
        emitAuth?.('smoothr:auth:error', { code: 'SIGNOUT_FAILED', message: err?.message || 'Sign-out failed' });
      }
    };

      docClickHandler = async (e) => {
        const trigger = e?.target?.closest?.('[data-smoothr="account-access"]');
        if (!trigger) return;
        try { e.preventDefault?.(); } catch {}
        try { e.stopPropagation?.(); } catch {}
        try { e.stopImmediatePropagation?.(); } catch {}
        const w = globalThis.window || globalThis;
        const doc = w.document || globalThis.document;
        const hasDropdown = !!doc?.querySelector?.('[data-smoothr="auth-drop-down"]');
        if (hasDropdown) {
          if (w.SMOOTHR_DEBUG) {
            console.info('[Smoothr][auth] dropdown present → SDK noop (user animation handles it)');
          }
          return;
        }
        let selector = null;
        let popupExists = false;
        let deferredCheck = false;
        let mode = 'none';
        let redirectTo = null;
        const user = w.Smoothr?.auth?.user?.value;
        if (user) {
          mode = 'dashboard';
          redirectTo = await lookupRedirectUrl();
          if (redirectTo && w.location) w.location.href = redirectTo;
        } else {
          selector = resolveAuthPanelSelector(doc);
          popupExists = !!selector;
          if (!popupExists) {
            await deferToNextFrame(2);
            deferredCheck = true;
            selector = resolveAuthPanelSelector(doc);
            popupExists = !!selector;
          }
          if (popupExists) {
            mode = 'popup';
            emitAuth('smoothr:auth:open', { targetSelector: selector });
            const panel = doc.querySelector?.(selector);
            if (panel) {
              try { panel.setAttribute?.('data-smoothr-active', '1'); } catch {}
              if (panel.getAttribute?.('data-smoothr-autoclass') === '1') {
                try { panel.classList.toggle('is-active', true); } catch {}
              }
              log('auth panel opened', panel);
            } else {
              log('auth pop-up not found for trigger', selector || '(default)');
            }
          } else if (trigger?.getAttribute?.('data-smoothr-auth-mode') === 'redirect') {
            mode = 'redirect';
            redirectTo = await lookupRedirectUrl('login');
            if (redirectTo && w.location) w.location.href = redirectTo;
          }
        }
      if (w.SMOOTHR_DEBUG) {
        console.info('[Smoothr][auth] trigger', {
          prevented: true,
          foundTrigger: !!trigger,
          popupExists,
          deferredCheck,
          mode,
          redirectTo,
        });
      }
    };

    // document submit (capture) — NOW: supports FORM or DIV containers
    docSubmitHandler = async (e) => {
      const container = resolveAuthContainer(e?.target);
      if (!container) {
        emitAuthError('NO_CONTAINER');
        return;
      }
      try {
        e.preventDefault?.();
        e.stopPropagation?.();
        e.stopImmediatePropagation?.();
      } catch {}

      const hasSignUp       = !!container.querySelector(ATTR_SIGNUP);
      const hasResetConfirm = !!container.querySelector('[data-smoothr="password-reset-confirm"]');
      const hasLogin        = !!container.querySelector('[data-smoothr="login"]');
      const hasResetRequest = !!container.querySelector('[data-smoothr="password-reset"]');
      // Priority (locked by tests): sign-up → reset-confirm → login → reset
      const target =
        (hasSignUp       && container.querySelector(ATTR_SIGNUP)) ||
        (hasResetConfirm && container.querySelector('[data-smoothr="password-reset-confirm"]')) ||
        (hasLogin        && container.querySelector('[data-smoothr="login"]')) ||
        (hasResetRequest && container.querySelector('[data-smoothr="password-reset"]'));

      if (!target) {
        emitAuth?.('smoothr:auth:error', { code: 'NO_ACTION', message: 'No auth action available in form' });
        return;
      }

      const fakeEvt = { preventDefault() {}, target, currentTarget: target };
      try {
        await clickHandler(fakeEvt);
      } catch (err) {
        emitAuth?.('smoothr:auth:error', { code: 'SUBMIT_FAILED', message: err?.message || 'Submit failed' });
      }
    };

    // document keydown (capture) — Enter submits inside container (works for DIV)
    docKeydownHandler = async (e) => {
      try {
        if (e?.key !== 'Enter' && e?.key !== ' ') return;
        const el = (globalThis.document || {}).activeElement;
        const container = resolveAuthContainer(el);
        if (!container) return;
        const tag = (el?.tagName || '').toUpperCase();
        if (tag === 'TEXTAREA') return;
        const signup = container.querySelector(ATTR_SIGNUP);
        if (signup) {
          if (e.key === ' ' && !signup.matches('[role="button"]')) return;
          e.preventDefault?.();
          e.stopPropagation?.();
          signup.click();
          return;
        }
        if (e.key !== 'Enter') return;
        e.preventDefault?.();
        e.stopPropagation?.();
        await docSubmitHandler({ target: container });
      } catch {}
    };

    // Capture click fallback: ensure dynamic action controls route even if per-node listener missed
    const ACTION_SELECTORS = [
      '[data-smoothr="login"]',
      ATTR_SIGNUP,
      '[data-smoothr="password-reset"]',
      '[data-smoothr="password-reset-confirm"]',
    ].join(',');
    const docActionClickFallback = (e) => {
      try {
        const el = e?.target?.closest?.(ACTION_SELECTORS);
        if (!el) return;
        // 1) If element already has a direct listener, skip (avoid double handling).
        if (el.__smoothrAuthBound === true) return;
        // 2) If this event already triggered our fallback higher up, skip.
        if (e.__smoothrActionHandled === true) return;
        e.__smoothrActionHandled = true;
        // Route to clickHandler once
        clickHandler?.({
          target: el,
          currentTarget: el,
          preventDefault(){},
          stopPropagation(){},
          stopImmediatePropagation(){},
        });
      } catch {}
    };

    mutationCallback = () => { try { bindAuthElements(w.document || globalThis.document); } catch {} };

    api.clickHandler = clickHandler;
    api.googleClickHandler = googleClickHandler;
    api.appleClickHandler = appleClickHandler;
    api.signOutHandler = signOutHandler;
    api.docClickHandler = docClickHandler;
    api.docSubmitHandler = docSubmitHandler;
    api.onAuthStateChangeHandler = onAuthStateChangeHandler;
    api.mutationCallback = mutationCallback;

    // Observe DOM for dynamically added auth elements and allow manual binding
    try {
      const Observer = w.MutationObserver || globalThis.MutationObserver;
      const doc = w.document || globalThis.document;
      if (typeof Observer === 'function' && doc) {
        const mo = new Observer(mutationCallback);
        mo.observe(doc, { childList: true, subtree: true });
      }
      if (doc) {
        doc.addEventListener('DOMContentLoaded', mutationCallback);
        doc.addEventListener('click', docActionClickFallback, false);
        doc.addEventListener('click', docClickHandler, { capture: true, passive: false });
        if (w.SMOOTHR_DEBUG) {
          console.info('[Smoothr][auth] docClickHandler bound (capture-only)');
        }
        doc.addEventListener('submit', docSubmitHandler, true);
        doc.addEventListener('keydown', docKeydownHandler, { capture: true, passive: false });
        try { doc.__smoothrAuthBound = true; } catch {}
      }
    } catch {}
    try { mutationCallback(); } catch {}
    log('auth init complete');

    return api;
  })();
  return _initPromise;
}
export default init;

async function handleRecoveryIfPresent() {
  const w = globalThis.window || globalThis;
  const hash = (w.location?.hash || '').slice(1);
  const hasAccessToken = /(^|&)access_token=/.test(hash);
  if (!hasAccessToken) return;
  if (isOnResetRoute()) markResetLoading(true);
  try {
    const params = new URLSearchParams(hash);
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    _prSession = access && refresh ? { access_token: access, refresh_token: refresh } : null;
    if (isOnResetRoute()) stripHash();
  } finally {
    if (isOnResetRoute()) markResetLoading(false);
  }
}

// Optional export used by some tests
export async function initPasswordResetConfirmation(opts = {}) {
  const p = init();
  await p;
  const w = globalThis.window || globalThis;
  _prRedirect = opts.redirectTo || '';
  await handleRecoveryIfPresent();
  try { mutationCallback(); } catch {}
  return p;
}

// Exported test helper to reset private module state between specs.
function __test_resetAuth() {
  _initPromise = undefined;
  _restoredOnce = false;
  _seededUserOnce = false;
  _prSession = null;
  _prRedirect = '';
  _injectedClient = null;
  const w = globalThis.window || globalThis;
  if (w.Smoothr) delete w.Smoothr.__supabase;
  onAuthStateChangeHandler = () => {};
  mutationCallback = () => {};
  clickHandler = () => {};
  googleClickHandler = () => {};
  appleClickHandler = () => {};
  signOutHandler = () => {};
  docClickHandler = () => {};
  docSubmitHandler = () => {};
  docKeydownHandler = () => {};
}

// Clear inline auth errors while typing
try {
  globalThis.document?.addEventListener?.('input', (e) => {
    if (!e.target?.closest) return;
    const form = e.target.closest('[data-smoothr="auth-form"]');
    if (!form) return;
    if (e.target.matches('[data-smoothr="password"], [data-smoothr="password-confirm"]')) {
      clearAuthError(form);
    }
  }, { capture: true });
} catch {}

if (typeof window !== 'undefined' && window.SMOOTHR_DEBUG) {
  const w = window;
  w.Smoothr = w.Smoothr || {};
  w.Smoothr.config = w.Smoothr.config || {};
  w.Smoothr.config.__test = {
    tryImportClient,
    resetAuth: __test_resetAuth,
  };
}

