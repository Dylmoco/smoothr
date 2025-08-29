// Side-effect-free barrel that preserves live ESM bindings for vitest spies.
export {
  default,
  init,
  resolveAuthContainer,
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
  getBrokerBaseUrl,
} from './init.js';

export { AUTH_CONTAINER_SELECTOR } from './constants.js';
