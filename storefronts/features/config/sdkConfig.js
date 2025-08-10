import supabase from '../../../supabase/browserClient.js';
import { getConfig } from './globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const log = (...args) => debug && console.log('[Smoothr Config]', ...args);
const warn = (...args) => console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId) {
  if (!storeId) return null;

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const access_token = session?.access_token;
    const supabaseUrl =
      supabase.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;

    const headers = {
      'Content-Type': 'application/json',
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    if (access_token) {
      headers.Authorization = `Bearer ${access_token}`;
    }

    const body = JSON.stringify({ store_id: storeId });
    let res = await fetch(
      `${supabaseUrl}/functions/v1/get_public_store_settings`,
      {
        method: 'POST',
        headers,
        body
      }
    );

    if ((res.status === 401 || res.status === 403) && headers.Authorization) {
      warn(
        'Store settings lookup failed with auth header:',
        res.status
      );
      delete headers.Authorization;
      res = await fetch(
        `${supabaseUrl}/functions/v1/get_public_store_settings`,
        { method: 'POST', headers, body }
      );
    }

    if (!res.ok) {
      let msg = '';
      try {
        msg = await res.text();
      } catch {}
      warn('Store settings lookup failed:', res.status, msg);
      return null;
    }

    const data = await res.json();
    log('Config fetched');
    return data || null;
  } catch (e) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}
