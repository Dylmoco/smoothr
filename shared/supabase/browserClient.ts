import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function applySessionAuth() {
  try {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (token) {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // no need for refresh token in this use case
      });
    }
  } catch {
    // ignore errors
  }
}

export { supabase, applySessionAuth };
