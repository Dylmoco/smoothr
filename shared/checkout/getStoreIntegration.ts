import { createServerSupabaseClient } from '../supabase/serverClient';

export async function getStoreIntegration(storeId: string, integrationId: string) {
  if (!storeId || !integrationId) return null;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('store_integrations')
    .select('api_key, settings')
    .eq('store_id', storeId)
    .eq('gateway', integrationId)
    .maybeSingle();
  if (error) {
    console.warn('[getStoreIntegration]', error.message || error);
    return null;
  }
  return data as { api_key?: string; settings?: any } | null;
}
