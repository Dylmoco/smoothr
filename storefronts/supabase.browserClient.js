import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof __NEXT_PUBLIC_SUPABASE_URL__ !== 'undefined' && __NEXT_PUBLIC_SUPABASE_URL__) ||
  'https://your-project.supabase.co';
const SUPABASE_ANON_KEY =
  (typeof __NEXT_PUBLIC_SUPABASE_ANON_KEY__ !== 'undefined' &&
    __NEXT_PUBLIC_SUPABASE_ANON_KEY__) ||
  'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
export default supabase;
