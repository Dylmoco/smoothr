// Stable barrel for the auth feature — no DOM work at import time.
// Simply re-export everything from init.js and provide a callable default.

export {
  default as init,
  initPasswordResetConfirmation,
  setSupabaseClient,
  resolveSupabase,
  onAuthStateChangeHandler,
  mutationCallback,
  clickHandler,
  googleClickHandler,
  appleClickHandler,
  passwordResetClickHandler,
  normalizeDomain,
  lookupRedirectUrl,
  lookupDashboardHomeUrl,
} from './init.js';

// Barrel default is a callable init
import init from './init.js';
const callable = (opts) => init(opts);
export default callable;

