// Side-effect-free barrel that preserves live ESM bindings for vitest spies.
export {
  default,
  init,
  setSupabaseClient,
  resolveSupabase,
  lookupRedirectUrl,
  normalizeDomain,
  initPasswordResetConfirmation,
  clickHandler,
  googleClickHandler,
  appleClickHandler,
  signOutHandler,
  docClickHandler,
  onAuthStateChangeHandler,
  mutationCallback,
  bindAuthElements,
} from './init.js';
