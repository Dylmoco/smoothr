import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.38.4";

const readEnv = (k: string): string | undefined =>
  (typeof Deno !== "undefined" && Deno.env?.get?.(k)) ||
  (typeof globalThis !== "undefined" && (globalThis as any).process?.env?.[k]) ||
  undefined;

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = readEnv("SUPABASE_URL");
  const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY");

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

export const supabase: SupabaseClient = (() => {
  try {
    return createSupabaseClient();
  } catch {
    return undefined as unknown as SupabaseClient;
  }
})();

