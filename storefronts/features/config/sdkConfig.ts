import { createClient } from '@supabase/supabase-js';
import supabase from '../../../supabase/supabaseClient.js';
import { getConfig } from './globalConfig.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
const warn = (...args: any[]) => debug && console.warn('[Smoothr Config]', ...args);

export async function loadPublicConfig(storeId: string) {
  if (!storeId) return null;

  const fetchSettings = async (client = supabase) =>
    await client
      .from('public_store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

  try {
    let { data, error } = await fetchSettings();

    const authError =
      error && (error.code === '403' || /jwt|token/i.test(error.message));
    if (authError) {
      warn('Config fetch returned 403, attempting session refresh');
      try {
        await supabase.auth.refreshSession();
      } catch {
        // ignore refresh errors
      }
      ({ data, error } = await fetchSettings());
      if (error && (error.code === '403' || /jwt|token/i.test(error.message))) {
        warn('Retry failed, fetching anonymously');
        try {
          const anon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          ({ data, error } = await fetchSettings(anon));
          if (error) {
            warn('Anonymous retry failed:', error.message || error);
            return null;
          }
        } catch (e: any) {
          warn('Anonymous fetch error:', e?.message || e);
          return null;
        }
      }
    }

    if (error) {
      warn('Store settings lookup failed:', error.message || error);
      return null;
    }
    return data || null;
  } catch (e: any) {
    warn('Store settings fetch error:', e?.message || e);
    return null;
  }
}
