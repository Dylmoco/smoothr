import { getSupabaseAdmin } from './supabaseAdmin';

const wildcardDomains = ['webflow.io', 'framer.website', 'webstudio.is'];

export async function getAllowOrigin(
  origin?: string,
  storeId?: string
): Promise<string | null> {
  if (!origin) return null;

  try {
    const { hostname } = new URL(origin);
    const envList = (process.env.SESSION_SYNC_ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const allowList = [...envList];
    if (storeId) {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin
        .from('stores')
        .select('store_domain, live_domain')
        .eq('id', storeId)
        .maybeSingle();
      if (data?.store_domain) allowList.push(data.store_domain);
      if (data?.live_domain) allowList.push(data.live_domain);
    }

    const isAllowed =
      allowList.includes(hostname) ||
      wildcardDomains.some(domain => hostname.endsWith(`.${domain}`));

    return isAllowed ? origin : null;
  } catch {
    return null;
  }
}

