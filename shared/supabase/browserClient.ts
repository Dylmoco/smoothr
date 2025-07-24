import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const options = process.env.NODE_ENV === 'test'
  ? { auth: { autoRefreshToken: false, persistSession: false } }
  : {};

const supabase = createClient(url, key, options);

export { supabase };
