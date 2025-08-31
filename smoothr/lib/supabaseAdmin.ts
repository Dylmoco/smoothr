import { createClient } from '@supabase/supabase-js';

function req(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getSupabaseAnonServer() {
  const url = req('NEXT_PUBLIC_SUPABASE_URL');
  const anon = req('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anon);
}

export function getSupabaseAdmin() {
  const url = req('NEXT_PUBLIC_SUPABASE_URL');
  const service = req('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, service);
}
