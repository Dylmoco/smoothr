import { supabase, ensureSupabaseSessionAuth } from '../../supabase/supabaseClient.js';

export async function getGatewayCredential(gateway) {
  try {
    await ensureSupabaseSessionAuth();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const access_token = session?.access_token;
    if (!access_token) {
      console.warn('[Smoothr] Missing access token for credential lookup');
      return null;
    }
    const supabaseUrl = supabase.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/get_gateway_credentials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gateway })
    });
    if (!res.ok) {
      console.warn('[Smoothr] Credential fetch failed:', res.statusText || res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn('[Smoothr] Credential fetch error:', e?.message || e);
    return null;
  }
}

export default getGatewayCredential;

