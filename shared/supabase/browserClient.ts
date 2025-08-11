import { createClient } from '@supabase/supabase-js';

let singleton: any | null = null;

export function initClient(url?: string, anonKey?: string) {
  // If already created, return it
  if (singleton) return singleton;

  // Prefer explicit args, else env, else noop placeholders (tests will mock createClient)
  const SUPABASE_URL = url || process.env.SUPABASE_URL || (globalThis as any)?.Smoothr?.config?.supabase?.url;
  const SUPABASE_ANON_KEY = anonKey || process.env.SUPABASE_ANON_KEY || (globalThis as any)?.Smoothr?.config?.supabase?.anonKey;

  // In tests, @supabase/supabase-js is mocked so createClient() returns the mockClient regardless of args.
  // If not in tests and no url/key, still create a client with dummy values; real network calls aren’t made in SDK init.
  const finalUrl = SUPABASE_URL || 'https://dummy.supabase.co';
  const finalKey = SUPABASE_ANON_KEY || 'dummy-anon-key';

  singleton = createClient(finalUrl, finalKey);
  return singleton;
}

export function getClient() {
  return singleton ?? initClient();
}

const supabase = getClient();
export default supabase;
