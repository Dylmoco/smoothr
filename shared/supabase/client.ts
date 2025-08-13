import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare const Deno: any;

const testMarker = '✅ supabase client loaded';

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL || (typeof Deno !== 'undefined' && Deno.env.get('SUPABASE_URL'));
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    (typeof Deno !== 'undefined' && Deno.env.get('SUPABASE_ANON_KEY'));

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase credentials: SUPABASE_URL and SUPABASE_ANON_KEY must be set'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

export { testMarker };

