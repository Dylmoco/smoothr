// Stable barrel for the auth feature — no DOM work at import time.
// Exposes a default callable init, a named init, a Supabase injector/resolver,
// and test-visible hook functions that start as no-ops.

let _injectedClient = null;

// Test-visible hooks (replaced by init at runtime)
export let onAuthStateChangeHandler = () => {};
export let mutationCallback = () => {};
export let clickHandler = () => {};
export let googleClickHandler = () => {};
export let appleClickHandler = () => {};
export let passwordResetClickHandler = () => {};

// Resolve a Supabase client from common places (Vitest-friendly)
export const resolveSupabase = () =>
  (globalThis?.window?.Smoothr?.auth?.client) ??
  _injectedClient ??
  globalThis?.supabase ??
  null;

// Allow init() to inject a client (mocks can assert this was called)
export const setSupabaseClient = (c) => { _injectedClient = c; };

// Re-export real initializer and also provide a callable default.
export { default as init, initPasswordResetConfirmation } from './init.js';
import init from './init.js';
const callable = (opts) => init(opts);
export default callable;

