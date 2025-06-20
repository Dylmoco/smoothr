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

export { supabase };
