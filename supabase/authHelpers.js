import { supabase } from '../shared/supabase/serverClient';

const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Auth]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Auth]', ...args);
const err = (...args) => debug && console.error('[Smoothr Auth]', ...args);

export function getOAuthRedirectUrl() {
  return (
    (typeof __NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__ !== 'undefined' &&
      __NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__) ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  );
}
export function getPasswordResetRedirectUrl() {
  return (
    (typeof __NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL__ !== 'undefined' &&
      __NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL__) ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  );
}

export function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export function updateStrengthMeter(form, password) {
  const meter = form.querySelector('[data-smoothr-password-strength]');
  if (!meter) return;
  const score = passwordStrength(password);
  const label = score >= 4 ? 'Strong' : score >= 3 ? 'Medium' : 'Weak';
  if (meter.tagName === 'PROGRESS') {
    meter.value = score;
  } else {
    meter.textContent = label;
  }
}

export function setLoading(el, loading) {
  if (!el) return;
  if (loading) {
    try {
      el.dataset.originalText = el.textContent;
    } catch {
      // dataset may be readonly
    }
    el.textContent = 'Loading...';
    el.disabled = true;
  } else {
    try {
      if (el.dataset.originalText) {
        el.textContent = el.dataset.originalText;
        delete el.dataset.originalText;
      }
    } catch {
      // ignore
    }
    el.disabled = false;
  }
}

export function findMessageContainer(start, selector) {
  let el = start;
  while (el) {
    if (el.matches && el.matches(selector)) return el;
    if (el.querySelector) {
      const found = el.querySelector(selector);
      if (found) return found;
    }
    el = el.parentElement;
  }
  return null;
}

export function showError(form, msg, input, trigger) {
  const target =
    findMessageContainer(trigger || form, '[data-smoothr-error]') ||
    form.querySelector('[data-smoothr-error]');
  if (target) {
    target.removeAttribute('hidden');
    target.textContent = msg;
    target.style.display = '';
    target.focus && target.focus();
  } else {
    err('No [data-smoothr-error] container found');
    alert(msg);
  }
  if (input && input.focus) input.focus();
}

export function showSuccess(form, msg, trigger) {
  const target =
    findMessageContainer(trigger || form, '[data-smoothr-success]') ||
    form.querySelector('[data-smoothr-success]');
  if (target) {
    target.removeAttribute('hidden');
    target.textContent = msg;
    target.style.display = '';
    target.focus && target.focus();
  } else {
    log('No [data-smoothr-success] container found');
    alert(msg);
  }
}

export function normalizeDomain(hostname) {
  hostname = hostname || '';
  return hostname.replace(/^www\./, '').toLowerCase();
}

export async function lookupRedirectUrl(type) {
  const domain = normalizeDomain(window.location.hostname);
  try {
    const { data, error } = await supabase
      .from('stores')
      .select(`${type}_redirect_url`)
      .eq('store_domain', domain)
      .single();
    if (error || !data) {
      throw error;
    }
    return data[`${type}_redirect_url`] || window.location.origin;
  } catch (error) {
    err(error);
    return window.location.origin;
  }
}

export function initAuth() {
  const p = supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (typeof window !== 'undefined') {
      window.smoothr = window.smoothr || {};
      window.smoothr.auth = { user: user || null };

      if (user) {
        log(`%c✅ Smoothr Auth: Logged in as ${user.email}`, 'color: #22c55e; font-weight: bold;');
      } else {
        log('%c🔒 Smoothr Auth: Not logged in', 'color: #f87171; font-weight: bold;');
      }

      const storage =
        typeof localStorage !== 'undefined'
          ? localStorage
          : typeof globalThis !== 'undefined'
            ? globalThis.localStorage
            : undefined;
      const oauthFlag = storage?.getItem?.('smoothr_oauth');
      if (oauthFlag && user) {
        document.dispatchEvent(new CustomEvent('smoothr:login', { detail: { user } }));
        storage?.removeItem?.('smoothr_oauth');
        const url = await lookupRedirectUrl('login');
        window.location.href = url;
      }
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    bindAuthElements();
    bindLogoutButtons();
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => bindAuthElements());
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
  return p;
}

export async function signInWithGoogle() {
  await lookupRedirectUrl('login');
  if (typeof window !== 'undefined') {
    localStorage.setItem('smoothr_oauth', '1');
  }
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getOAuthRedirectUrl() }
  });
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (!error && typeof window !== 'undefined') {
    window.smoothr = window.smoothr || {};
    window.smoothr.auth = { user: data.user || null };
  }
  return { data, error };
}

export async function requestPasswordReset(email) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl()
  });
}

export function initPasswordResetConfirmation({ redirectTo = '/' } = {}) {
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token });
    }
    document
      .querySelectorAll('form[data-smoothr="password-reset-confirm"]')
      .forEach(form => {
        const passwordInput = form.querySelector('[data-smoothr-input="password"]');
        if (passwordInput && passwordInput.addEventListener) {
          passwordInput.addEventListener('input', () => {
            updateStrengthMeter(form, passwordInput.value);
          });
        }
        form.addEventListener && form.addEventListener('submit', async evt => {
          evt.preventDefault();
          const confirmInput = form.querySelector('[data-smoothr-input="password-confirm"]');
          const password = passwordInput?.value || '';
          const confirm = confirmInput?.value || '';
          if (passwordStrength(password) < 3) {
            showError(form, 'Weak password', passwordInput, form);
            return;
          }
          if (password !== confirm) {
            showError(form, 'Passwords do not match', confirmInput, form);
            return;
          }
          const submitBtn = form.querySelector('[type="submit"]');
          setLoading(submitBtn, true);
          try {
            const { data, error } = await supabase.auth.updateUser({ password });
            if (error) {
              showError(form, error.message || 'Password update failed', submitBtn, form);
            } else {
              if (typeof window !== 'undefined') {
                window.smoothr = window.smoothr || {};
                window.smoothr.auth = { user: data.user || null };
              }
              showSuccess(form, 'Password updated', form);
              setTimeout(() => {
                window.location.href = redirectTo;
              }, 1000);
            }
          } catch (err) {
            showError(form, err.message || 'Password update failed', submitBtn, form);
          } finally {
            setLoading(submitBtn, false);
          }
        });
      });
  });
}

// Placeholder functions to avoid reference errors. These will be provided by
// storefront modules at runtime.
export let bindAuthElements = () => {};
export let bindLogoutButtons = () => {};

export function registerDOMBindings(bindAuth, bindLogout) {
  bindAuthElements = bindAuth;
  bindLogoutButtons = bindLogout;
}
