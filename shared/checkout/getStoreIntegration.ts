import { createServerSupabaseClient } from '../supabase/serverClient';

// Add ?smoothr-debug to the URL to enable debug logging
const debug =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('smoothr-debug');

export async function getStoreIntegration(storeId: string, integrationId: string) {
  if (!storeId || !integrationId) return null;
  const supabase = createServerSupabaseClient();
  if (debug) console.log('[STEP] Fetching store_integrations...');
  const { data, error } = await supabase
    .from('store_integrations')
    .select('api_key, settings')
    .eq('store_id', storeId)
    .eq('gateway', integrationId)
    .maybeSingle();
  if (error) {
    if (debug) console.warn('[getStoreIntegration]', error.message || error);
    return null;
  }
  return data as { api_key?: string; settings?: any } | null;
}
