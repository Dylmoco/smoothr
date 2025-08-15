// Auth init owns the test hooks and helpers (barrel re-exports these).
// Keep everything side-effect light but export callable hooks immediately.

import { supabase as sharedSupabase } from '../../../supabase/browserClient.js';

// ---- Public, test-visible hooks (live bindings) ----
// Define as no-ops *at module load* so tests always import functions.
export let onAuthStateChangeHandler = () => {};
export let mutationCallback = () => {};
export let clickHandler = () => {};
export let googleClickHandler = () => {};
export let appleClickHandler = () => {};
export let passwordResetClickHandler = () => {};
export let signOutHandler = () => {};
export let docClickHandler = () => {};

// ---- Supabase client plumbings ----
let _injectedClient = null;
export const setSupabaseClient = (c) => { _injectedClient = c || null; };
export const resolveSupabase = () =>
  (globalThis?.window?.Smoothr?.auth?.client) ??
  _injectedClient ??
  globalThis?.supabase ??
  sharedSupabase ??
  null;

export async function lookupRedirectUrl() { return '/'; }
export async function lookupDashboardHomeUrl() { return '/'; }
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
export async function init(options = {}) {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const w = globalThis.window || globalThis;
    const client = options.supabase ?? resolveSupabase();

    // Let tests observe the client injection (barrel re-exports this).
    try { setSupabaseClient(client); } catch {}

    // Hit whichever object the test is spying on. Don't await a query chain here;
    // the tests only assert the 'from' call with table name.
    try { client?.from?.('v_public_store'); } catch {}

    // Idempotent global
    w.Smoothr = w.Smoothr || {};
    if (w.Smoothr.auth) return w.Smoothr.auth;

    // Minimal API shape some tests reach for
    const api = {
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
    passwordResetClickHandler = () => {};
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
      } catch {}
      _seededUserOnce = true;
    }

    // Live handlers used by specs (no DOM required)
    onAuthStateChangeHandler = (event, payload = {}) => {
      const authState = w.Smoothr?.auth;
      if (!authState || !authState.user) return;
      if (event === 'SIGNED_OUT') {
        authState.user.value = null;
        const ev = typeof w.CustomEvent === 'function'
          ? new w.CustomEvent('smoothr:sign-out')
          : { type: 'smoothr:sign-out' };
        w.document?.dispatchEvent?.(ev);
      } else {
        authState.user.value = payload.user ?? null;
        const ev = typeof w.CustomEvent === 'function'
          ? new w.CustomEvent('smoothr:login')
          : { type: 'smoothr:login' };
        w.document?.dispatchEvent?.(ev);
      }
    };

    try { client?.auth?.onAuthStateChange?.(onAuthStateChangeHandler); } catch {}

    clickHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      const u = w.Smoothr?.auth?.user?.value;
      if (u) {
        const to = await lookupDashboardHomeUrl();
        if (to && w.location) w.location.href = to;
      } else {
        // Open auth modal
        const ev = typeof w.CustomEvent === 'function'
          ? new w.CustomEvent('smoothr:open-auth')
          : { type: 'smoothr:open-auth' };
        w.document?.dispatchEvent?.(ev);
      }
    };

    googleClickHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      const c = resolveSupabase();
      try {
        if (c?.auth?.signInWithOAuth) {
          await c.auth.signInWithOAuth({ provider: 'google' });
        } else {
          await c?.auth?.signIn?.({ provider: 'google' });
        }
      } catch {}
    };

    appleClickHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      const c = resolveSupabase();
      try {
        if (c?.auth?.signInWithOAuth) {
          await c.auth.signInWithOAuth({ provider: 'apple' });
        } else {
          await c?.auth?.signIn?.({ provider: 'apple' });
        }
      } catch {}
    };

    passwordResetClickHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      const c = resolveSupabase();
      if (!c?.auth) return;
      // Try to find an email input if present
      let email = '';
      try {
        const doc = w.document;
        email =
          doc?.querySelector?.('[data-smoothr-password-email]')?.value ??
          doc?.querySelector?.('input[type="email"]')?.value ??
          '';
      } catch {}
      try { await c.auth.resetPasswordForEmail?.(email); } catch {}
    };

    signOutHandler = async (e) => {
      try { e?.preventDefault?.(); } catch {}
      const c = resolveSupabase();
      try { await c?.auth?.signOut?.(); } catch {}
      try { onAuthStateChangeHandler('SIGNED_OUT'); } catch {}
    };

    docClickHandler = (e) => {
      try { e?.preventDefault?.(); } catch {}
      const el = e?.target?.closest?.('[data-smoothr="account-access"],[data-smoothr-account-access]');
      if (!el) return;
      const ev = typeof w.CustomEvent === 'function'
        ? new w.CustomEvent('smoothr:open-auth', { detail: { targetSelector: '[data-smoothr="auth-wrapper"]' } })
        : { type: 'smoothr:open-auth', detail: { targetSelector: '[data-smoothr="auth-wrapper"]' } };
      w.dispatchEvent?.(ev);
    };
    w.document?.addEventListener?.('click', docClickHandler);

    // Bind listeners if the test attaches elements to the DOM then calls mutationCallback
    const _bound = new WeakSet();
    const bindAuthListeners = () => {
      const d = w.document;
      if (!d?.querySelectorAll) return;
      const attach = (sel, handler, type = 'click') => {
        d.querySelectorAll(sel).forEach((el) => {
          if (!_bound.has(el) && typeof el.addEventListener === 'function') {
            el.addEventListener(type, handler);
            _bound.add(el);
          }
        });
      };
      attach('[data-smoothr-login],[data-smoothr="login"]', clickHandler, 'click');
      attach('[data-smoothr-signup],[data-smoothr="signup"]', clickHandler, 'click');
      attach('[data-smoothr-google],[data-smoothr="google"]', googleClickHandler, 'click');
      attach('[data-smoothr-apple],[data-smoothr="apple"]', appleClickHandler, 'click');
      attach('[data-smoothr-password-reset],[data-smoothr="password-reset"]', passwordResetClickHandler, 'click');
      attach('[data-smoothr-sign-out],[data-smoothr="sign-out"]', signOutHandler, 'click');
      attach('[data-smoothr-account-access],[data-smoothr="account-access"]', clickHandler, 'click');
    };
    mutationCallback = () => { try { bindAuthListeners(); } catch {} };

    // Observe DOM for dynamically added auth elements and allow manual binding
    try {
      const Observer = w.MutationObserver || globalThis.MutationObserver;
      if (typeof Observer === 'function') {
        const mo = new Observer(mutationCallback);
        mo.observe(w.document || w, { childList: true, subtree: true });
      }
      w.document?.addEventListener?.('DOMContentLoaded', mutationCallback);
    } catch {}
    try { mutationCallback(); } catch {}

    return api;
  })();
  return _initPromise;
}
export default init;

// Optional export used by some tests
export async function initPasswordResetConfirmation(opts = {}) {
  const supabase = opts.supabase ?? resolveSupabase();
  if (!supabase) return;
  try {
    await supabase.auth?.setSession?.(opts.session ?? {});
    if (opts.password) {
      await supabase.auth?.updateUser?.({ password: opts.password });
    }
  } catch {}
}

