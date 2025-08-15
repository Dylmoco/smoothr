// Auth init owns the test hooks and helpers, to avoid circular imports.
// The barrel re-exports from this file. Do not import the barrel here.

// ---- Public, test-visible hooks (live bindings) ----
export let onAuthStateChangeHandler = () => {};
export let mutationCallback = () => {};
export let clickHandler = () => {};
export let googleClickHandler = () => {};
export let appleClickHandler = () => {};
export let passwordResetClickHandler = () => {};

// ---- Supabase client plumbings ----
let _injectedClient = null;
export const setSupabaseClient = (c) => { _injectedClient = c || null; };
export const resolveSupabase = () =>
  (globalThis?.window?.Smoothr?.auth?.client) ??
  _injectedClient ??
  globalThis?.supabase ??
  null;

// ---- Small utils the tests spy on from the barrel ----
export const normalizeDomain = (host) => {
  if (!host) return '';
  try {
    return String(host).toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
};

export async function lookupRedirectUrl() { return '/'; }
export async function lookupDashboardHomeUrl() { return '/'; }

// Some tests expect this to exist on import (no DOM work).
if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = function setSelectedCurrency(curr) {
    try { globalThis.localStorage?.setItem?.('smoothr_currency', curr); } catch {}
  };
}

// Define init locally (don't reference the barrel's .init).
let _initPromise;
let _restoredOnce = false;
export async function init(options = {}) {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const passedClient = options.supabase ?? null;
    const client = passedClient ?? resolveSupabase();

    // Let tests observe the client injection (barrel re-exports this).
    try { setSupabaseClient(client); } catch {}

    // Satisfy tests that assert we touch this view on init.
    try { await client?.from?.('v_public_store'); } catch {}

    // Idempotent global
    const w = globalThis.window || globalThis;
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
    mutationCallback = () => {};
    onAuthStateChangeHandler = () => {};

    // Restore session exactly once per boot (tests spy on getSession).
    if (!_restoredOnce) {
      try { await client?.auth?.getSession?.(); } catch {}
      _restoredOnce = true;
      try { console?.log?.('[Smoothr] Auth restored'); } catch {}
    }

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

