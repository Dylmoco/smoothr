import { createSupabaseClient } from '../supabase/client';

export async function getActiveGatewayCreds(storeId: string, providerKey: string) {
  if (!storeId || !providerKey) return null;

  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('integrations')
    .select('publishable_key, api_login_id, tokenization_key, sandbox')
    .eq('store_id', storeId)
    .eq('provider_key', providerKey)
    .eq('is_default', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  let secretKey: string | null = null;
  try {
    const { data: secretData, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('secret')
      .eq('name', `${providerKey}_secret_key_${storeId}`)
      .maybeSingle();
    if (!secretError) {
      secretKey = (secretData as any)?.secret ?? null;
    }
  } catch {
    // ignore secret lookup errors
  }

  return {
    publishable_key: (data as any)?.publishable_key ?? null,
    api_login_id: (data as any)?.api_login_id ?? null,
    tokenization_key: (data as any)?.tokenization_key ?? null,
    secret_key: secretKey,
    sandbox: (data as any)?.sandbox ?? false,
  } as {
    publishable_key: string | null;
    api_login_id: string | null;
    tokenization_key: string | null;
    secret_key: string | null;
    sandbox: boolean;
  };
}
