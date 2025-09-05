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
  requestPasswordReset,
  verifyResetToken,
  updatePassword,
  googleClickHandler,
  appleClickHandler,
  signOutHandler,
  docClickHandler,
  onAuthStateChangeHandler,
  mutationCallback,
  bindAuthElements,
  getBrokerBaseUrl,
  signInWithGoogle,
  signInWithApple,
} from './init.js';

export { AUTH_CONTAINER_SELECTOR } from './constants.js';
