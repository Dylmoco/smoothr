import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL =
  (typeof __NEXT_PUBLIC_SUPABASE_URL__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_URL__) ||
  'https://your-project.supabase.co';
const DEFAULT_SUPABASE_KEY =
  (typeof __NEXT_PUBLIC_SUPABASE_ANON_KEY__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_ANON_KEY__) ||
  'your-anon-key';
const DEFAULT_SUPABASE_PASSWORD_RESET_REDIRECT_URL =
  (typeof __NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL__ !== 'undefined' &&
    __NEXT_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL__) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

let supabase;

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function updateStrengthMeter(form, password) {
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

function setLoading(el, loading) {
  if (!el) return;
  if (loading) {
    el.dataset.originalText = el.textContent;
    el.textContent = 'Loading...';
    el.disabled = true;
  } else {
    if (el.dataset.originalText) {
      el.textContent = el.dataset.originalText;
      delete el.dataset.originalText;
    }
    el.disabled = false;
  }
}

function findMessageContainer(start, selector) {
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

function showError(form, msg, input, trigger) {
  const target =
    findMessageContainer(trigger || form, '[data-smoothr-error]') ||
    form.querySelector('[data-smoothr-error]');
  if (target) {
    target.removeAttribute('hidden');
    target.textContent = msg;
    target.style.display = '';
    target.focus && target.focus();
  } else {
    console.error('No [data-smoothr-error] container found');
    alert(msg);
  }
  if (input && input.focus) input.focus();
}

function showSuccess(form, msg, trigger) {
  const target =
    findMessageContainer(trigger || form, '[data-smoothr-success]') ||
    form.querySelector('[data-smoothr-success]');
  if (target) {
    target.removeAttribute('hidden');
    target.textContent = msg;
    target.style.display = '';
    target.focus && target.focus();
  } else {
    if (window.SMOOTHR_CONFIG?.debug) {
      console.log('No [data-smoothr-success] container found');
    }
    alert(msg);
  }
}

export function initAuth({
  supabaseUrl = DEFAULT_SUPABASE_URL,
  supabaseKey = DEFAULT_SUPABASE_KEY
} = {}) {
  supabase = createClient(supabaseUrl, supabaseKey);
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (typeof window !== 'undefined') {
      window.smoothr = window.smoothr || {};
      window.smoothr.auth = { user: user || null };

      if (window.SMOOTHR_CONFIG?.debug) {
        if (user) {
          console.log(
            `%c✅ Smoothr Auth: Logged in as ${user.email}`,
            'color: #22c55e; font-weight: bold;'
          );
        } else {
          console.log(
            '%c🔒 Smoothr Auth: Not logged in',
            'color: #f87171; font-weight: bold;'
          );
        }
      }

      const oauthFlag = localStorage.getItem('smoothr_oauth');
      if (oauthFlag && user) {
        const isNewUser =
          user.created_at &&
          user.updated_at &&
          user.created_at === user.updated_at;
        showSuccess(
          document,
          isNewUser ? 'Account created! Redirecting...' : 'Logged in, redirecting...'
        );
        document.dispatchEvent(new CustomEvent('smoothr:login', { detail: { user } }));
        localStorage.removeItem('smoothr_oauth');
        const url = await lookupRedirectUrl('login');
        setTimeout(() => {
          window.location.href = url;
        }, 1000);
      }
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    bindAuthElements();
    bindLogoutButtons();
    const observer = new MutationObserver(() => bindAuthElements());
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

//
// Bind login click handlers using a <div> button instead of a form submit.
// This avoids Webflow's password field restrictions on staging domains by never
// triggering a native submit event.
//
function bindAuthElements(root = document) {
  const selector =
    '[data-smoothr="login"], [data-smoothr="signup"], [data-smoothr="login-google"], [data-smoothr="signup-google"], [data-smoothr="password-reset"]';
  root.querySelectorAll(selector).forEach(el => {
    if (el.dataset.smoothrBoundAuth) return;
    el.dataset.smoothrBoundAuth = '1';
    const type = el.getAttribute('data-smoothr');
    const attach = handler => {
      if (el.tagName === 'FORM') {
        el.addEventListener('submit', handler);
      } else {
        el.addEventListener('click', handler);
      }
    };
    const form = el.tagName === 'FORM' ? el : el.closest('form');

    switch (type) {
      case 'login': {
        if (form && el !== form && !form.dataset.smoothrBoundLoginSubmit) {
          form.dataset.smoothrBoundLoginSubmit = '1';
          form.addEventListener('submit', evt => {
            evt.preventDefault();
            el.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
          });
        }
        attach(async evt => {
          evt.preventDefault();
          const targetForm = form;
          if (!targetForm) return;
          const email = targetForm.querySelector('[data-smoothr-input="email"]');
          const passwordInput = targetForm.querySelector('[data-smoothr-input="password"]');
          const emailVal = email?.value || '';
          const password = passwordInput?.value || '';
          if (!isValidEmail(emailVal)) {
            showError(targetForm, 'Enter a valid email address', email, el);
            return;
          }
          setLoading(el, true);
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: emailVal,
              password
            });
            if (!error) {
              if (typeof window !== 'undefined') {
                window.smoothr = window.smoothr || {};
                window.smoothr.auth = { user: data.user || null };
              }
              showSuccess(targetForm, 'Logged in, redirecting...', el);
              document.dispatchEvent(
                new CustomEvent('smoothr:login', { detail: data })
              );
              const url = await lookupRedirectUrl('login');
              setTimeout(() => {
                window.location.href = url;
              }, 1000);
            } else {
                showError(targetForm, error.message || 'Invalid credentials', email, el);
            }
          } catch (err) {
              showError(targetForm, err.message || 'Network error', email, el);
          } finally {
            setLoading(el, false);
          }
        });
        break;
      }
      case 'login-google': {
        attach(async evt => {
          evt.preventDefault();
          await signInWithGoogle(el);
        });
        break;
      }
      case 'signup-google': {
        attach(async evt => {
          evt.preventDefault();
          await signInWithGoogle(el);
        });
        break;
      }
      case 'signup': {
        if (form) {
          const passwordInput = form.querySelector('[data-smoothr-input="password"]');
          passwordInput?.addEventListener('input', () => {
            updateStrengthMeter(form, passwordInput.value);
          });
        }
        attach(async evt => {
          evt.preventDefault();
          const targetForm = form;
          if (!targetForm) return;
          const emailInput = targetForm.querySelector('[data-smoothr-input="email"]');
          const passwordInput = targetForm.querySelector('[data-smoothr-input="password"]');
          const confirmInput = targetForm.querySelector('[data-smoothr-input="password-confirm"]');
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
          const submitBtn = targetForm.querySelector('[type="submit"]');
          setLoading(submitBtn, true);
          try {
            const { data, error } = await signUp(email, password);
            if (error) {
              showError(targetForm, error.message || 'Signup failed', emailInput, el);
            } else {
              if (typeof window !== 'undefined') {
                window.smoothr = window.smoothr || {};
                window.smoothr.auth = { user: data.user || null };
              }
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
            setLoading(submitBtn, false);
          }
        });
        break;
      }
      case 'password-reset': {
        attach(async evt => {
          evt.preventDefault();
          const targetForm = form;
          if (!targetForm) return;
          const emailInput = targetForm.querySelector('[data-smoothr-input="email"]');
          const email = emailInput?.value || '';
          if (!isValidEmail(email)) {
            showError(targetForm, 'Enter a valid email address', emailInput, el);
            return;
          }
          const submitBtn = targetForm.querySelector('[type="submit"]');
          setLoading(submitBtn, true);
          try {
            const { error } = await requestPasswordReset(email);
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
            setLoading(submitBtn, false);
          }
        });
        break;
      }
    }
  });
}

function bindLogoutButtons() {
  document.querySelectorAll('[data-smoothr="logout"]').forEach(btn => {
    btn.addEventListener('click', async evt => {
      evt.preventDefault();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error(error);
      }
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (typeof window !== 'undefined') {
        window.smoothr = window.smoothr || {};
        window.smoothr.auth = { user: user || null };

        if (window.SMOOTHR_CONFIG?.debug) {
          if (user) {
            console.log(
              `%c✅ Smoothr Auth: Logged in as ${user.email}`,
              'color: #22c55e; font-weight: bold;'
            );
          } else {
            console.log(
              '%c🔒 Smoothr Auth: Not logged in',
              'color: #f87171; font-weight: bold;'
            );
          }
        }
      }
      document.dispatchEvent(new CustomEvent('smoothr:logout'));
      const url = await lookupRedirectUrl('logout');
      window.location.href = url;
    });
  });
}

export async function signInWithGoogle(trigger) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('smoothr_oauth', '1');
  }
  setLoading(trigger, true);
  try {
    const redirectTo =
      typeof window !== 'undefined'
        ? `https://www.smoothr.io/oauth-callback?redirect_uri=${encodeURIComponent(
            window.location.origin
          )}`
        : undefined;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
  } catch (err) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smoothr_oauth');
    }
    console.error('Google OAuth failed', err);
    if (typeof document !== 'undefined') {
      const target = document.querySelector('[data-smoothr-error]');
      if (target) {
        target.removeAttribute('hidden');
        target.textContent = err.message || 'Google OAuth failed';
        target.style.display = '';
        target.focus && target.focus();
      }
    }
  } finally {
    setLoading(trigger, false);
  }
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
    redirectTo: DEFAULT_SUPABASE_PASSWORD_RESET_REDIRECT_URL
  });
}

export function initPasswordResetConfirmation({ redirectTo = '/' } = {}) {
  if (!supabase) {
    supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
  }
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
        passwordInput?.addEventListener('input', () => {
          updateStrengthMeter(form, passwordInput.value);
        });
        form.addEventListener('submit', async evt => {
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

export function normalizeDomain(hostname) {
  return hostname.replace(/^www\./, '').toLowerCase();
}

export async function lookupRedirectUrl(type) {
  const domain = normalizeDomain(window.location.hostname);
  const fallback = '/';
  try {
    const { data, error } = await supabase
      .from('stores')
      .select(`${type}_redirect_url`)
      .eq('store_domain', domain)
      .single();
    if (error || !data || !data[`${type}_redirect_url`]) {
      console.warn(
        `Smoothr Auth: no ${type} redirect configured for ${domain}, using ${fallback}`
      );
      return fallback;
    }
    const url = data[`${type}_redirect_url`];
    if (window.SMOOTHR_CONFIG?.debug) {
      console.log(`Smoothr Auth: ${type} redirect resolved`, url);
    }
    return url;
  } catch (err) {
    console.error('Smoothr Auth: redirect lookup failed', err);
    console.warn(`Smoothr Auth: using fallback ${fallback}`);
    return fallback;
  }
}
