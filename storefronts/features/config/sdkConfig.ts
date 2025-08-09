import supabase from '../../../supabase/browserClient.js';
import { getConfig } from './globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const log = (...args: any[]) => debug && console.log('[Smoothr Config]', ...args);
const warn = (...args: any[]) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId: string) {
  if (!storeId) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const access_token = session?.access_token;
    const supabaseUrl = supabase.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
    if (access_token) {
      headers.Authorization = `Bearer ${access_token}`;
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/get_public_store_settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ store_id: storeId }),
    });

    if (!res.ok) {
      warn('Store settings lookup failed:', res.status);
      return null;
    }

    const data = await res.json();
    log('Config fetched');
    return data || null;
  } catch (e: any) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}
