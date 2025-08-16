import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getEnv(name: string): string | undefined {
  // Prefer Deno env in Edge runtime; fall back to Node env for Vitest.
  // IMPORTANT: let errors from Deno.env.get bubble so tests can assert 500.
  const denoEnvGet = (globalThis as any)?.Deno?.env?.get;
  if (typeof denoEnvGet === 'function') {
    return denoEnvGet(name) ?? undefined;
  }
  if (typeof process !== 'undefined' && process?.env) return process.env[name];
  return undefined;
}

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  }

  // Expose default auth headers so tests can assert them.
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    },
  });
}

