import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL =
  (typeof __NEXT_PUBLIC_SUPABASE_URL__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_URL__) ||
  'https://your-project.supabase.co';
const DEFAULT_SUPABASE_KEY =
  (typeof __NEXT_PUBLIC_SUPABASE_ANON_KEY__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_ANON_KEY__) ||
  'your-anon-key';
const DEFAULT_SUPABASE_OAUTH_REDIRECT_URL =
  (typeof __NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__ !== 'undefined' &&
    __NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL__) ||
  (typeof window !== 'undefined' ? window.location.origin : '');
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

function showError(form, msg, input) {
  const target = form.querySelector('[data-smoothr-error]');
  if (target) {
    target.textContent = msg;
    target.style.display = '';
    target.focus && target.focus();
  } else {
    alert(msg);
  }
  if (input && input.focus) input.focus();
}

function showSuccess(form, msg) {
  const target = form.querySelector('[data-smoothr-success]');
  if (target) {
    target.textContent = msg;
    target.style.display = '';
    target.focus && target.focus();
  } else {
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

      const oauthFlag = localStorage.getItem('smoothr_oauth');
      if (oauthFlag && user) {
        document.dispatchEvent(new CustomEvent('smoothr:login', { detail: { user } }));
        localStorage.removeItem('smoothr_oauth');
        const url = await lookupRedirectUrl('login');
        window.location.href = url;
      }
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    bindLoginDivs();
    bindLoginForms();
    bindLogoutButtons();
    bindGoogleLoginButtons();
    bindSignupForms();
    bindPasswordResetForms();
  });
}

//
// Bind login click handlers using a <div> button instead of a form submit.
// This avoids Webflow's password field restrictions on staging domains by never
// triggering a native submit event.
//
function bindLoginDivs() {
  document.querySelectorAll('[data-smoothr="login"]').forEach(btn => {
    btn.addEventListener('click', async evt => {
      evt.preventDefault();
      const form = btn.closest('form[data-smoothr="login-form"]');
      if (!form) return;
      const email = form.querySelector('[data-smoothr-input="email"]');
      const passwordInput = form.querySelector('[data-smoothr-input="password"]');
      const emailVal = email?.value || '';
      const password = passwordInput?.value || '';
      if (!isValidEmail(emailVal)) {
        showError(form, 'Enter a valid email address', email);
        return;
      }
      setLoading(btn, true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: emailVal, password });
        if (!error) {
          showSuccess(form, 'Logged in, redirecting...');
          document.dispatchEvent(new CustomEvent('smoothr:login', { detail: data }));
          const url = await lookupRedirectUrl('login');
          setTimeout(() => {
            window.location.href = url;
          }, 1000);
        } else {
          showError(form, error.message || 'Invalid credentials', email);
        }
      } catch (err) {
        showError(form, err.message || 'Network error', email);
      } finally {
        setLoading(btn, false);
      }
    });
  });
}

function bindLoginForms() {
  document.querySelectorAll('form[data-smoothr="login-form"]').forEach(form => {
    form.addEventListener('submit', evt => {
      evt.preventDefault();
      const btn = form.querySelector('[data-smoothr="login"]');
      btn?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    });
  });
}

function bindGoogleLoginButtons() {
  document.querySelectorAll('[data-smoothr="login-google"]').forEach(btn => {
    btn.addEventListener('click', async evt => {
      evt.preventDefault();
      await signInWithGoogle();
    });
  });
}

function bindSignupForms() {
  document.querySelectorAll('form[data-smoothr="signup"]').forEach(form => {
    const passwordInput = form.querySelector('[data-smoothr-input="password"]');
    passwordInput?.addEventListener('input', () => {
      updateStrengthMeter(form, passwordInput.value);
    });
    form.addEventListener('submit', async evt => {
      evt.preventDefault();
      const emailInput = form.querySelector('[data-smoothr-input="email"]');
      const confirmInput = form.querySelector('[data-smoothr-input="password-confirm"]');
      const email = emailInput?.value || '';
      const password = passwordInput?.value || '';
      const confirm = confirmInput?.value || '';
      if (!isValidEmail(email)) {
        showError(form, 'Enter a valid email address', emailInput);
        return;
      }
      if (passwordStrength(password) < 3) {
        showError(form, 'Weak password', passwordInput);
        return;
      }
      if (password !== confirm) {
        showError(form, 'Passwords do not match', confirmInput);
        return;
      }
      const submitBtn = form.querySelector('[type="submit"]');
      setLoading(submitBtn, true);
      try {
        const { data, error } = await signUp(email, password);
        if (error) {
          showError(form, error.message || 'Signup failed', emailInput);
        } else {
          document.dispatchEvent(new CustomEvent('smoothr:login', { detail: data }));
          showSuccess(form, 'Account created! Redirecting...');
          const url = await lookupRedirectUrl('login');
          setTimeout(() => {
            window.location.href = url;
          }, 1000);
        }
      } catch (err) {
        showError(form, err.message || 'Network error', emailInput);
      } finally {
        setLoading(submitBtn, false);
      }
    });
  });
}

function bindPasswordResetForms() {
  document.querySelectorAll('form[data-smoothr="password-reset"]').forEach(form => {
    form.addEventListener('submit', async evt => {
      evt.preventDefault();
      const emailInput = form.querySelector('[data-smoothr-input="email"]');
      const email = emailInput?.value || '';
      if (!isValidEmail(email)) {
        showError(form, 'Enter a valid email address', emailInput);
        return;
      }
      const submitBtn = form.querySelector('[type="submit"]');
      setLoading(submitBtn, true);
      try {
        const { error } = await requestPasswordReset(email);
        if (error) {
          showError(form, error.message || 'Error requesting password reset', emailInput);
        } else {
          showSuccess(form, 'Check your email for a reset link.');
        }
      } catch (err) {
        showError(form, err.message || 'Error requesting password reset', emailInput);
      } finally {
        setLoading(submitBtn, false);
      }
    });
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
      document.dispatchEvent(new CustomEvent('smoothr:logout'));
      const url = await lookupRedirectUrl('logout');
      window.location.href = url;
    });
  });
}

export async function signInWithGoogle() {
  await lookupRedirectUrl('login');
  if (typeof window !== 'undefined') {
    localStorage.setItem('smoothr_oauth', '1');
  }
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: DEFAULT_SUPABASE_OAUTH_REDIRECT_URL }
  });
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
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
            showError(form, 'Weak password', passwordInput);
            return;
          }
          if (password !== confirm) {
            showError(form, 'Passwords do not match', confirmInput);
            return;
          }
          const submitBtn = form.querySelector('[type="submit"]');
          setLoading(submitBtn, true);
          try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
              showError(form, error.message || 'Password update failed', submitBtn);
            } else {
              showSuccess(form, 'Password updated');
              setTimeout(() => {
                window.location.href = redirectTo;
              }, 1000);
            }
          } catch (err) {
            showError(form, err.message || 'Password update failed', submitBtn);
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
  } catch (err) {
    console.error(err);
    return window.location.origin;
  }
}
