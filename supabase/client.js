import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof __NEXT_PUBLIC_SUPABASE_URL__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_URL__) ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://your-project.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof __NEXT_PUBLIC_SUPABASE_ANON_KEY__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_ANON_KEY__) ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'your-anon-key';

export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
