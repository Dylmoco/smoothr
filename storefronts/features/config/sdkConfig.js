import supabase from '../../../supabase/browserClient.js';
import { getConfig } from './globalConfig.js';

export const SUPABASE_URL = 'https://lpuqrzvokroazwlricgn.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdXFyenZva3JvYXp3bHJpY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTM2MzQsImV4cCI6MjA2NTI4OTYzNH0.bIItSJMzdx9BgXm5jOtTFI03yq94CLVHepiPQ0Xl_lU';

const sdkConfig = {
  supabaseUrl: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

Object.assign(getConfig(), sdkConfig);

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
    const cfg = getConfig();
    const supabaseUrl =
      cfg.supabaseUrl ||
      supabase.supabaseUrl ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      cfg.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const headers = {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${access_token || anonKey}`
    };

    const body = JSON.stringify({ store_id: storeId });
    let res = await fetch(
      `${supabaseUrl}/functions/v1/get_public_store_settings`,
      {
        method: 'POST',
        headers,
        body
      }
    );

    if ((res.status === 401 || res.status === 403) && access_token) {
      warn(
        'Store settings lookup failed with auth header:',
        res.status
      );
      headers.Authorization = `Bearer ${anonKey}`;
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

export default sdkConfig;
