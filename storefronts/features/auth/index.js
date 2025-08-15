// Auth barrel: side-effect-free, stable export shapes.
// Re-export everything from init.js so tests can spy on these symbols here.
export {
  // lifecycle
  init as init,
  default as default,
  // hooks
  onAuthStateChangeHandler,
  mutationCallback,
  clickHandler,
  googleClickHandler,
  appleClickHandler,
  passwordResetClickHandler,
  // client plumbing
  setSupabaseClient,
  resolveSupabase,
  // utils spied in tests
  lookupRedirectUrl,
  lookupDashboardHomeUrl,
  normalizeDomain,
  // optional flow
  initPasswordResetConfirmation,
} from './init.js';

