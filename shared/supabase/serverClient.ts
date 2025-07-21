import { createClient } from '@supabase/supabase-js';

console.log('[Smoothr] Loaded serverClient.ts from shared/supabase ✅');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
});
