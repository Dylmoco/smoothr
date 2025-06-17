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

let supabase;

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
    bindLogoutButtons();
    bindGoogleLoginButtons();
    bindSignupForms();
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
      const email = form.querySelector('[data-smoothr-input="email"]')?.value || '';
      const password = form.querySelector('[data-smoothr-input="password"]')?.value || '';
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          console.log(data.user ? 'Logged in as: ' + data.user.email : 'Logged in');
          document.dispatchEvent(new CustomEvent('smoothr:login', { detail: data }));
          const url = await lookupRedirectUrl('login');
          window.location.href = url;
        } else {
          console.error(error);
        }
      } catch (err) {
        console.error(err);
      }
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
    form.addEventListener('submit', async evt => {
      evt.preventDefault();
      const email = form.querySelector('[data-smoothr-input="email"]')?.value || '';
      const password = form.querySelector('[data-smoothr-input="password"]')?.value || '';
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        console.error('Invalid email address');
        return;
      }
      if (password.length < 6) {
        console.error('Password must be at least 6 characters');
        return;
      }
      try {
        const { error } = await signUp(email, password);
        if (error) {
          console.error(error);
        }
      } catch (err) {
        console.error(err);
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
  if (!error) {
    document.dispatchEvent(new CustomEvent('smoothr:login', { detail: data }));
    const url = await lookupRedirectUrl('login');
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }
  return { data, error };
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
