import { createClient } from '@supabase/supabase-js';

let supabase;

export function initAuth({ supabaseUrl, supabaseKey }) {
  supabase = createClient(supabaseUrl, supabaseKey);
  bindLoginForms();
  bindLogoutButtons();
}

function bindLoginForms() {
  document.querySelectorAll('[data-smoothr-auth="login"]').forEach(form => {
    form.addEventListener('submit', async evt => {
      evt.preventDefault();
      const fd = new FormData(form);
      const email = fd.get('email');
      const password = fd.get('password');
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
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

function bindLogoutButtons() {
  document.querySelectorAll('[data-smoothr-auth="logout"]').forEach(btn => {
    btn.addEventListener('click', async evt => {
      evt.preventDefault();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error(error);
      }
      document.dispatchEvent(new CustomEvent('smoothr:logout'));
      const url = await lookupRedirectUrl('logout');
      window.location.href = url;
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
