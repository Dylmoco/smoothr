import { createClient } from './client.js';

const supabase = createClient();

export async function signInWithPassword(credentials) {
  return supabase.auth.signInWithPassword(credentials);
}

export async function signInWithOAuth(options) {
  return supabase.auth.signInWithOAuth(options);
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function setSession(tokens) {
  return supabase.auth.setSession(tokens);
}

export async function logout() {
  return supabase.auth.signOut();
}

export async function lookupRedirectUrl(action) {
  if (typeof window === 'undefined') return '/';
  try {
    const hostname = window.location.hostname;
    const { data, error } = await supabase
      .from('stores')
      .select('login_redirect_url')
      .eq('hostname', hostname)
      .maybeSingle();
    if (error) {
      console.error('lookupRedirectUrl error:', error);
      return '/';
    }
    return data?.login_redirect_url || '/';
  } catch (err) {
    console.error('lookupRedirectUrl unexpected error:', err);
    return '/';
  }
}

export async function initAuth() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('smoothr_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await setSession({ access_token, refresh_token });
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
    const {
      data: { session }
    } = await getSession();
    window.smoothr = window.smoothr || {};
    window.smoothr.auth = { user: session?.user || null };
    window.supabase = supabase;
    return session;
  }
  const { data } = await getSession();
  return data.session;
}

export function bindLoginUI() {
  const form = document.querySelector('[data-smoothr-login-form]');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const emailEl = form.querySelector('[data-smoothr-login-email]');
      const passEl = form.querySelector('[data-smoothr-login-password]');
      const email = emailEl?.value;
      const password = passEl?.value;
      if (!email || !password) {
        return console.error('Smoothr Auth: missing email or password');
      }
      const { data, error } = await signInWithPassword({ email, password });
      if (error) return alert(error.message);
      document.dispatchEvent(
        new CustomEvent('smoothr:login', { detail: data })
      );
      const url = await lookupRedirectUrl('login');
      window.location.replace(url);
    });
  }

  const googleBtn = document.querySelector('[data-smoothr-login-google]');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      signInWithOAuth({ provider: 'google' });
    });
  }
}
