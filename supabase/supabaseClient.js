// Use workspace dependency if available, fallback for browser builds
import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL)) ||
  (typeof __NEXT_PUBLIC_SUPABASE_URL__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_URL__) ||
  'https://your-project.supabase.co';

export const DEFAULT_SUPABASE_KEY =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)) ||
  (typeof __NEXT_PUBLIC_SUPABASE_ANON_KEY__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_ANON_KEY__) ||
  'your-anon-key';

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
  global: {
    headers: {
      apikey: DEFAULT_SUPABASE_KEY,
      Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default supabase;
