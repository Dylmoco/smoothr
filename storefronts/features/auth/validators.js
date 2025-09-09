// storefronts/features/auth/validators.js
export function validatePasswordsOrThrow(password, confirm) {
  if (typeof password !== 'string' || typeof confirm !== 'string') {
    throw new Error('password_invalid_input');
  }
  const trimmed = password.trim();
  const strong = /[A-Za-z]/.test(trimmed) && /[0-9]/.test(trimmed) && trimmed.length >= 8;
  if (!strong) {
    // keep this conservative; your existing weak-password UI still applies elsewhere
    throw new Error('password_too_weak');
  }
  if (password !== confirm) {
    throw new Error('password_mismatch');
  }
  return true;
}
