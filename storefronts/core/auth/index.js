import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lpuqrzvokroazwlricgn.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdXFy' +
  'enZva3JvYXp3bHJpY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTM2MzQsImV4cCI6MjA2NTI4' +
  'OTYzNH0.bIItSJMzdx9BgXm5jOtTFI03yq94CLVHepiPQ0Xl_lU';

let supabase;

export function initAuth({
  supabaseUrl = DEFAULT_SUPABASE_URL,
  supabaseKey = DEFAULT_SUPABASE_KEY
} = {}) {
  supabase = createClient(supabaseUrl, supabaseKey);
  supabase.auth.getUser().then(({ data: { user } }) => {
    console.log(user ? 'Logged in as: ' + user.email : 'Not logged in');
  });
  document.addEventListener('DOMContentLoaded', () => {
    bindLoginDivs();
    bindLogoutButtons();
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

function bindLogoutButtons() {
  document.querySelectorAll('[data-smoothr="logout"]').forEach(btn => {
    btn.addEventListener('click', async evt => {
      evt.preventDefault();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error(error);
      }
      const { data: { user } } = await supabase.auth.getUser();
      console.log(user ? 'Logged in as: ' + user.email : 'Not logged in');
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
