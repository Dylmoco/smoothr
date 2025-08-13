import { createSupabaseClient } from '../supabase/client';

// Add ?smoothr-debug to the URL to enable debug logging
const debug =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('smoothr-debug');

export async function getStoreIntegration(storeId: string, integrationId: string) {
  if (!storeId || !integrationId) return null;
  const supabase = createSupabaseClient();
  if (debug) console.log('[STEP] Fetching integrations...');
  const { data, error } = await supabase
    .from('integrations')
    .select('provider_key, publishable_key')
    .eq('store_id', storeId)
    .eq('provider_key', integrationId)
    .maybeSingle();

  if (error) {
    if (debug) console.warn('[getStoreIntegration]', error.message || error);
    return null;
  }

  let secretKey: string | null = null;
  try {
    const { data: secretData, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('secret')
      .eq('name', `${integrationId}_secret_key_${storeId}`)
      .maybeSingle();
    if (secretError) {
      if (debug)
        console.warn('[getStoreIntegration] secret lookup error', secretError.message);
    } else {
      secretKey = (secretData as any)?.secret || null;
    }
  } catch (e: any) {
    if (debug) console.warn('[getStoreIntegration] secret lookup failed', e);
  }

  return {
    provider_key: data?.provider_key,
    publishable_key: (data as any)?.publishable_key ?? null,
    secret_key: secretKey,
    api_key: (data as any)?.publishable_key ?? null,
    settings: {
      api_key: (data as any)?.publishable_key ?? null,
      secret_key: secretKey,
      client_id: (data as any)?.publishable_key ?? null,
      secret: secretKey,
    } as any,
  } as {
    provider_key?: string;
    publishable_key?: string | null;
    secret_key?: string | null;
    api_key?: string | null;
    settings?: any;
  } | null;
}
