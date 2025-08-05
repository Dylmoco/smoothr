import { supabase, ensureSupabaseSessionAuth } from '../../../supabase/supabaseClient.js';
import {
  initAuth as initAuthHelper,
  signInWithGoogle,
  signInWithApple,
  requestPasswordReset,
  lookupRedirectUrl,
  lookupDashboardHomeUrl,
  normalizeDomain,
  isValidEmail,
  passwordStrength,
  updateStrengthMeter,
  setLoading,
  showError,
  showSuccess,
  registerDOMBindings,
  findMessageContainer
} from '../../../supabase/authHelpers.js';

// Ensure SMOOTHR_CONFIG is accessible in both browser and non-browser environments
const globalScope = typeof window !== 'undefined' ? window : globalThis;
const SMOOTHR_CONFIG = globalScope.SMOOTHR_CONFIG || {};

let initialized = false;

let debug = SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Auth]', ...args);

// minimal reactive ref implementation
function ref(val) {
  return { value: val };
}

const user = ref(null);

function updateGlobalAuth() {
  if (typeof window !== 'undefined') {
    window.Smoothr = window.Smoothr || {};
    window.Smoothr.auth = auth;
    window.smoothr = window.smoothr || window.Smoothr;
    window.smoothr.auth = auth;
  }
}

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { data: { store_id: SMOOTHR_CONFIG.storeId } }
  });
  if (!error) {
    user.value = data.user || null;
    updateGlobalAuth();
    await ensureSupabaseSessionAuth();
  }
  return { data, error };
}

async function signup(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { store_id: SMOOTHR_CONFIG.storeId } }
  });
  if (!error) {
    user.value = data.user || null;
    updateGlobalAuth();
    await ensureSupabaseSessionAuth();
  }
  return { data, error };
}

async function resetPassword(email) {
  return await requestPasswordReset(email);
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  const {
    data: { user: currentUser }
  } = await supabase.auth.getUser();
  user.value = currentUser || null;
  updateGlobalAuth();
  if (typeof window !== 'undefined') {
    if (currentUser) {
      log(
        `%c✅ Smoothr Auth: Logged in as ${currentUser.email}`,
        'color: #22c55e; font-weight: bold;'
      );
    } else {
      log('%c🔒 Smoothr Auth: Not logged in', 'color: #f87171; font-weight: bold;');
    }
  }
  return { error };
}

async function initAuth(...args) {
  await initAuthHelper(...args);
  if (typeof window !== 'undefined') {
    user.value = window.smoothr?.auth?.user || null;
    updateGlobalAuth();
  }
}

function initPasswordResetConfirmation({ redirectTo = '/' } = {}) {
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token });
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
                const { data, error } = await supabase.auth.updateUser({ password });
                if (error) {
                  showError(form, error.message || 'Password update failed', trigger, trigger);
                } else {
                  user.value = data.user || null;
                updateGlobalAuth();
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

function safeSetDataset(el, key, val) {
  try {
    if (el && el.dataset) el.dataset[key] = val;
  } catch {
    // dataset might be readonly
  }
}

function bindAuthElements(root = document) {
  document.querySelectorAll('[data-smoothr="login"]').forEach(el => {
    if (el.dataset.smoothrBoundAuth) return;
    safeSetDataset(el, 'smoothrBoundAuth', '1');

    const form = el.closest ? el.closest('[data-smoothr="auth-form"]') : null;

    el.addEventListener &&
      el.addEventListener('click', async evt => {
        evt.preventDefault();
        const targetForm = form;
        if (!targetForm) return;
        const emailInput = targetForm.querySelector('[data-smoothr="email"]');
        const passwordInput = targetForm.querySelector('[data-smoothr="password"]');
        const emailVal = emailInput?.value || '';
        const password = passwordInput?.value || '';
        if (!isValidEmail(emailVal)) {
          showError(targetForm, 'Enter a valid email address', emailInput, el);
          return;
        }
        setLoading(el, true);
        try {
          const { data, error } = await login(emailVal, password);
          if (!error) {
            showSuccess(targetForm, 'Logged in, redirecting...', el);
            document.dispatchEvent(new CustomEvent('smoothr:login', { detail: data }));
            const url = await lookupRedirectUrl('login');
            setTimeout(() => {
              window.location.href = url;
            }, 1000);
          } else {
            showError(targetForm, error.message || 'Invalid credentials', emailInput, el);
          }
        } catch (err) {
          showError(targetForm, err.message || 'Network error', emailInput, el);
        } finally {
          setLoading(el, false);
        }
      });
  });

  const selector =
    '[data-smoothr="signup"], [data-smoothr="login-google"], [data-smoothr="login-apple"], [data-smoothr="password-reset"]';
  root.querySelectorAll(selector).forEach(el => {
    if (el.dataset.smoothrBoundAuth) return;
    safeSetDataset(el, 'smoothrBoundAuth', '1');
    const type = el.getAttribute('data-smoothr');
    const form = el.closest ? el.closest('[data-smoothr="auth-form"]') : null;

    switch (type) {
      case 'login-google': {
        el.addEventListener('click', async evt => {
          evt.preventDefault();
          await signInWithGoogle();
        });
        break;
      }
      case 'login-apple': {
        el.addEventListener('click', async evt => {
          evt.preventDefault();
          await signInWithApple();
        });
        break;
      }
      case 'signup': {
        if (form) {
          const passwordInput = form.querySelector('[data-smoothr="password"]');
          if (passwordInput && passwordInput.addEventListener) {
            passwordInput.addEventListener('input', () => {
              updateStrengthMeter(form, passwordInput.value);
            });
          }
        }
        el.addEventListener('click', async evt => {
          evt.preventDefault();
          const targetForm = form;
          if (!targetForm) return;
          const emailInput = targetForm.querySelector('[data-smoothr="email"]');
          const passwordInput = targetForm.querySelector('[data-smoothr="password"]');
          const confirmInput = targetForm.querySelector('[data-smoothr="password-confirm"]');
          const email = emailInput?.value || '';
          const password = passwordInput?.value || '';
          const confirm = confirmInput?.value || '';
          if (!isValidEmail(email)) {
            showError(targetForm, 'Enter a valid email address', emailInput, el);
            return;
          }
          if (passwordStrength(password) < 3) {
            showError(targetForm, 'Weak password', passwordInput, el);
            return;
          }
          if (password !== confirm) {
            showError(targetForm, 'Passwords do not match', confirmInput, el);
            return;
          }
          setLoading(el, true);
          try {
            const { data, error } = await signup(email, password);
            if (error) {
              showError(targetForm, error.message || 'Signup failed', emailInput, el);
            } else {
              document.dispatchEvent(new CustomEvent('smoothr:login', { detail: data }));
              showSuccess(targetForm, 'Account created! Redirecting...', el);
              const url = await lookupRedirectUrl('login');
              setTimeout(() => {
                window.location.href = url;
              }, 1000);
            }
          } catch (err) {
            showError(targetForm, err.message || 'Network error', emailInput, el);
          } finally {
            setLoading(el, false);
          }
        });
        break;
      }
      case 'password-reset': {
        el.addEventListener('click', async evt => {
          evt.preventDefault();
          const targetForm = form;
          if (!targetForm) return;
          const emailInput = targetForm.querySelector('[data-smoothr="email"]');
          const email = emailInput?.value || '';
          if (!isValidEmail(email)) {
            showError(targetForm, 'Enter a valid email address', emailInput, el);
            return;
          }
          setLoading(el, true);
          try {
            const { error } = await resetPassword(email);
            if (error) {
              showError(
                targetForm,
                error.message || 'Error requesting password reset',
                emailInput,
                el
              );
            } else {
              showSuccess(targetForm, 'Check your email for a reset link.', el);
            }
          } catch (err) {
            showError(
              targetForm,
              err.message || 'Error requesting password reset',
              emailInput,
              el
            );
          } finally {
            setLoading(el, false);
          }
        });
        break;
      }
    }
  });

  if (!document.__smoothrAccountAccessHandler) {
    document.__smoothrAccountAccessHandler = async evt => {
      const el = evt.target.closest('[data-smoothr="account-access"]');
      if (!el) return;
      evt.preventDefault();
      await ensureSupabaseSessionAuth();
      const userRef = window.smoothr?.auth?.user;
      const isLoggedIn = userRef?.value !== null;
      log('Resolved login state:', isLoggedIn ? 'authenticated' : 'not authenticated');
      if (isLoggedIn) {
        const url = (await lookupDashboardHomeUrl()) || '/account';
        log('Redirecting to dashboard:', url);
        window.location.href = url;
      } else {
        log("Dispatching 'smoothr:open-auth' event");
        window.dispatchEvent(
          new CustomEvent('smoothr:open-auth', {
            detail: { targetSelector: '[data-smoothr="auth-wrapper"]' }
          })
        );
      }
    };
    document.addEventListener('click', document.__smoothrAccountAccessHandler);
  }
}

function bindSignOutButtons() {
  document.querySelectorAll('[data-smoothr="sign-out"]').forEach(btn => {
    btn.addEventListener('click', async evt => {
      evt.preventDefault();
      const { error } = await signOut();
      if (error) {
        log(error);
      }
      document.dispatchEvent(new CustomEvent('smoothr:sign-out'));
      const url = await lookupRedirectUrl('sign-out');
      window.location.href = url;
    });
  });
}

const auth = {
  login,
  signup,
  resetPassword,
  signOut,
  logout: signOut,
  getSession: () => supabase.auth.getSession(),
  initAuth,
  user,
  client: supabase
};

export async function init(config = {}) {
  updateGlobalAuth();
  if (initialized) {
    log('Auth module already initialized');
    return window.Smoothr?.auth;
  }

  if (typeof window !== 'undefined') {
    window.SMOOTHR_CONFIG = { ...(window.SMOOTHR_CONFIG || {}), ...config };
  }
  Object.assign(SMOOTHR_CONFIG, config);

  const debugQuery =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('smoothr-debug') === 'true';
  debug = SMOOTHR_CONFIG?.debug || debugQuery;

  registerDOMBindings(bindAuthElements, bindSignOutButtons);

  await initAuth();
  await ensureSupabaseSessionAuth();

  updateGlobalAuth();

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null;
    updateGlobalAuth();
  });

  if (debug) {
    console.log('[Smoothr] Auth module loaded');
  }

  initialized = true;
  return window.Smoothr?.auth;
}

export {
  init,
  initAuth,
  initPasswordResetConfirmation,
  signInWithGoogle,
  signInWithApple,
  lookupRedirectUrl,
  lookupDashboardHomeUrl,
  normalizeDomain,
  login,
  signup,
  resetPassword,
  signOut,
  user
};

export default auth;

