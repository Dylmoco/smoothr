// storefronts/features/auth/validators.js
export const ERR_WEAK_PASSWORD = 'Please choose a stronger password.';
export const ERR_PASSWORD_MISMATCH = 'Passwords do not match.';

export function ensureStrongPassword(pwd) {
  return (
    typeof pwd === 'string' &&
    pwd.length >= 8 &&
    /[A-Za-z]/.test(pwd) &&
    /[0-9]/.test(pwd)
  );
}

export function comparePasswords(p, c) {
  return p === c;
}

export function validatePasswordsOrThrow(password, confirm) {
  if (typeof password !== 'string' || typeof confirm !== 'string') {
    throw new Error('password_invalid_input');
  }
  if (!ensureStrongPassword(password)) {
    throw new Error('password_too_weak');
  }
  if (!comparePasswords(password, confirm)) {
    throw new Error('password_mismatch');
  }
  return true;
}
