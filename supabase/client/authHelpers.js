import { loadPublicConfig } from '../../storefronts/features/config/sdkConfig.js';

async function getSupabase() {
  const w = typeof window !== 'undefined' ? window : globalThis;
  return (await (w.Smoothr?.supabaseReady || Promise.resolve(null))) || null;
}

const globalScope = typeof window !== 'undefined' ? window : globalThis;
const SMOOTHR_CONFIG = globalScope.SMOOTHR_CONFIG || {};

const debug = SMOOTHR_CONFIG.debug;
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

const cachedRedirectUrls = {};
let cachedDashboardHomeUrl;

export async function lookupRedirectUrl(type = 'login') {
  if (cachedRedirectUrls[type]) return cachedRedirectUrls[type];

  try {
    const config = await loadPublicConfig(SMOOTHR_CONFIG.storeId);
    let url;
    if (type === 'login') {
      url =
        config?.sign_in_redirect_url ??
        config?.public_settings?.sign_in_redirect_url ??
        window.location.origin;
    } else {
      const key = `${type}_redirect_url`;
      url =
        config?.[key] ??
        config?.public_settings?.[key] ??
        window.location.origin;
    }
    cachedRedirectUrls[type] = url;
    return url;
  } catch (error) {
    console.warn('[Smoothr Auth] Redirect lookup failed:', error);
    const fallback = window.location.origin;
    cachedRedirectUrls[type] = fallback;
    return fallback;
  }
}

export async function lookupDashboardHomeUrl() {
  if (cachedDashboardHomeUrl) return cachedDashboardHomeUrl;

  try {
    const config = await loadPublicConfig(SMOOTHR_CONFIG.storeId);
    const url =
      config?.dashboard_home_url ??
      config?.public_settings?.dashboard_home_url ??
      window.location.origin;
    cachedDashboardHomeUrl = url;
    return url;
  } catch (error) {
    console.warn('[Smoothr Auth] Dashboard home lookup failed:', error);
    const fallback = window.location.origin;
    cachedDashboardHomeUrl = fallback;
    return fallback;
  }
}

export async function initAuth() {
  try {
    const mod = await import('./browserClient.js');
    await mod.ensureSupabaseSessionAuth?.();
  } catch {}
  const supabase = await getSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (typeof window !== 'undefined') {
    window.smoothr = window.smoothr || {};
    window.smoothr.auth = { user: user || null };

    if (user) {
      log(
        `%c✅ Smoothr Auth: Logged in as ${user.email}`,
        'color: #22c55e; font-weight: bold;'
      );
    } else {
      log(
        '%c🔒 Smoothr Auth: Not logged in',
        'color: #f87171; font-weight: bold;'
      );
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
  const setupBindings = () => {
    bindAuthElements();
    bindSignOutButtons();
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        bindAuthElements();
        bindSignOutButtons();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };
  if (document.readyState !== 'loading') {
    setupBindings();
  } else {
    document.addEventListener('DOMContentLoaded', setupBindings);
  }
  return user || null;
}

export async function signInWithGoogle() {
  await lookupRedirectUrl('login');
  if (typeof window !== 'undefined') {
    localStorage.setItem('smoothr_oauth', '1');
  }
  try {
    const mod = await import('./browserClient.js');
    await mod.ensureSupabaseSessionAuth?.();
  } catch {}
  const supabase = await getSupabase();
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getOAuthRedirectUrl() }
  });
}

export async function signInWithApple() {
  await lookupRedirectUrl('login');
  if (typeof window !== 'undefined') {
    localStorage.setItem('smoothr_oauth', '1');
  }
  try {
    const mod = await import('./browserClient.js');
    await mod.ensureSupabaseSessionAuth?.();
  } catch {}
  const supabase = await getSupabase();
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: getOAuthRedirectUrl() }
  });
}

export async function signUp(email, password) {
  try {
    const mod = await import('./browserClient.js');
    await mod.ensureSupabaseSessionAuth?.();
  } catch {}
  const supabase = await getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase unavailable') };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { store_id: SMOOTHR_CONFIG.storeId } }
  });
  if (!error && typeof window !== 'undefined') {
    window.smoothr = window.smoothr || {};
    window.smoothr.auth = { user: data.user || null };
  }
  return { data, error };
}

export async function requestPasswordReset(email) {
  try {
    const mod = await import('./browserClient.js');
    await mod.ensureSupabaseSessionAuth?.();
  } catch {}
  const supabase = await getSupabase();
  if (!supabase)
    return { data: null, error: new Error('Supabase unavailable') };
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
      getSupabase().then(async supabase => {
        if (!supabase) return;
        try {
          const mod = await import('./browserClient.js');
          await mod.ensureSupabaseSessionAuth?.();
        } catch {}
        await supabase.auth.setSession({ access_token, refresh_token });
      });
    }
    document
      .querySelectorAll('[data-smoothr="password-reset-confirm"]')
      .forEach(trigger => {
        const form =
          trigger.closest?.('[data-smoothr="auth-form"]') ||
          findMessageContainer(trigger, '[data-smoothr="auth-form"]');
        if (!form) return;
        const passwordInput = form.querySelector('[data-smoothr="password"]');
        if (passwordInput && passwordInput.addEventListener) {
          passwordInput.addEventListener('input', () => {
            updateStrengthMeter(form, passwordInput.value);
          });
        }
        trigger.addEventListener &&
          trigger.addEventListener('click', async evt => {
            evt.preventDefault();
            const confirmInput = form.querySelector('[data-smoothr="password-confirm"]');
            const password = passwordInput?.value || '';
            const confirm = confirmInput?.value || '';
            if (passwordStrength(password) < 3) {
              showError(form, 'Weak password', passwordInput, trigger);
              return;
            }
            if (password !== confirm) {
              showError(form, 'Passwords do not match', confirmInput, trigger);
              return;
            }
            setLoading(trigger, true);
            try {
              const mod = await import('./browserClient.js');
              await mod.ensureSupabaseSessionAuth?.();
              const supabase = await getSupabase();
              if (!supabase) throw new Error('Supabase unavailable');
              const { data, error } = await supabase.auth.updateUser({ password });
              if (error) {
                showError(
                  form,
                  error.message || 'Password update failed',
                  trigger,
                  trigger
                );
              } else {
                if (typeof window !== 'undefined') {
                  window.smoothr = window.smoothr || {};
                  window.smoothr.auth = { user: data.user || null };
                }
                showSuccess(form, 'Password updated', trigger);
                setTimeout(() => {
                  window.location.href = redirectTo;
                }, 1000);
              }
            } catch (err) {
              showError(form, err.message || 'Password update failed', trigger, trigger);
            } finally {
              setLoading(trigger, false);
            }
          });
      });
  });
}

// Placeholder functions to avoid reference errors. These will be provided by
// storefront modules at runtime.
export let bindAuthElements = () => {};
export let bindSignOutButtons = () => {};

export function registerDOMBindings(bindAuth, bindSignOut) {
  bindAuthElements = bindAuth;
  bindSignOutButtons = bindSignOut;
}
