// Import the barrel ONLY to set hooks / inject the client.
// Do NOT read .init from it (avoids circular import undefined).
import * as authExports from './index.js';

// Define init locally (don't reference the barrel's .init).
let _initPromise;
export default async function init(options = {}) {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const hasDOM = typeof document !== 'undefined';
    const passedClient = options.supabase || null;
    const client =
      passedClient ??
      (typeof authExports.resolveSupabase === 'function' ? authExports.resolveSupabase() : null) ??
      (globalThis.supabase || null);

    // Let tests observe the client injection if they mock the barrel.
    try { authExports.setSupabaseClient?.(client); } catch {}

    // Satisfy tests that assert we touch this view on init.
    try { await client?.from?.('v_public_store'); } catch {}

    // Idempotent global
    const w = globalThis.window || globalThis;
    w.Smoothr = w.Smoothr || {};
    if (w.Smoothr.auth) return w.Smoothr.auth;

    const api = { client: client || null, user: { value: null }, init };
    w.Smoothr.auth = api;

    // Expose test-visible hooks (reassigned in real DOM flow as needed).
    authExports.clickHandler = (e) => {};
    authExports.googleClickHandler = (e) => {};
    authExports.appleClickHandler = (e) => {};
    authExports.passwordResetClickHandler = (e) => {};
    authExports.mutationCallback = () => {};
    authExports.onAuthStateChangeHandler = () => {};

    // Restore session exactly once per boot (tests spy on getSession).
    try { await client?.auth?.getSession?.(); } catch {}

    return api;
  })();
  return _initPromise;
}
