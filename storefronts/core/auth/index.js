import { supabase } from '../../../shared/supabase/browserClient';
import {
  initAuth,
  initPasswordResetConfirmation,
  signInWithGoogle,
  signUp,
  requestPasswordReset,
  lookupRedirectUrl,
  normalizeDomain,
  isValidEmail,
  passwordStrength,
  updateStrengthMeter,
  setLoading,
  showError,
  showSuccess,
  registerDOMBindings
} from '../../../supabase/authHelpers.js';

const debug = window.SMOOTHR_CONFIG?.debug;
const log = (...args) => debug && console.log('[Smoothr Auth]', ...args);

function safeSetDataset(el, key, val) {
  try {
    if (el && el.dataset) el.dataset[key] = val;
  } catch (err) {
    // dataset might be readonly
  }
}

function bindAuthElements(root = document) {
  document.querySelectorAll('[data-smoothr="login"]').forEach(el => {
    if (el.dataset.smoothrBoundAuth) return;
    safeSetDataset(el, 'smoothrBoundAuth', '1');

    const form = el.closest('[data-smoothr="login-form"]');
    if (form && !form.dataset?.smoothrBoundLoginSubmit) {
      safeSetDataset(form, 'smoothrBoundLoginSubmit', '1');
      form.addEventListener &&
        form.addEventListener('submit', evt => {
          evt.preventDefault();
          el.dispatchEvent &&
            el.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
        });
    }

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
    '[data-smoothr="signup"], [data-smoothr="login-google"], [data-smoothr="password-reset"]';
  root.querySelectorAll(selector).forEach(el => {
    if (el.dataset.smoothrBoundAuth) return;
    safeSetDataset(el, 'smoothrBoundAuth', '1');
    const type = el.getAttribute('data-smoothr');
    const attach = handler => {
      if (el.tagName === 'FORM') {
        el.addEventListener && el.addEventListener('submit', handler);
      } else {
        el.addEventListener && el.addEventListener('click', handler);
      }
    };
    const form = el.tagName === 'FORM' ? el : el.closest('form');

    switch (type) {
      case 'login-google': {
        attach(async evt => {
          evt.preventDefault();
          await signInWithGoogle();
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
        attach(async evt => {
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
          const emailInput = targetForm.querySelector('[data-smoothr="email"]');
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
        log(error);
      }
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (typeof window !== 'undefined') {
        window.smoothr = window.smoothr || {};
        window.smoothr.auth = { user: user || null };

        if (user) {
          log(`%c✅ Smoothr Auth: Logged in as ${user.email}`, 'color: #22c55e; font-weight: bold;');
        } else {
          log('%c🔒 Smoothr Auth: Not logged in', 'color: #f87171; font-weight: bold;');
        }
      }
      document.dispatchEvent(new CustomEvent('smoothr:logout'));
      const url = await lookupRedirectUrl('logout');
      window.location.href = url;
    });
  });
}

registerDOMBindings(bindAuthElements, bindLogoutButtons);

export {
  initAuth,
  initPasswordResetConfirmation,
  signInWithGoogle,
  signUp,
  requestPasswordReset,
  lookupRedirectUrl,
  normalizeDomain
};
