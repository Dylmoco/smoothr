// storefronts/features/auth/validators.js
export function validatePasswordsOrThrow(password, confirm) {
  if (typeof password !== 'string' || typeof confirm !== 'string') {
    throw new Error('password_invalid_input');
  }
  if (password.trim().length < 8) {
    // keep this conservative; your existing weak-password UI still applies elsewhere
    throw new Error('password_too_weak');
  }
  if (password !== confirm) {
    throw new Error('password_mismatch');
  }
  return true;
}
