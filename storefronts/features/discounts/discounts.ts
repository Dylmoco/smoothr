import { supabase } from '../../../supabase/supabaseClient.js';

const debug = typeof window !== 'undefined' && window.SMOOTHR_CONFIG?.debug;
const log = (...args: any[]) => debug && console.log('[Smoothr Discounts]', ...args);
const warn = (...args: any[]) => debug && console.warn('[Smoothr Discounts]', ...args);

export interface DiscountRecord {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  amount: number;
  active?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  max_redemptions?: number | null;
  redemptions?: number | null;
  limit_per_customer?: number | null;
}

export async function validateDiscount(code: string): Promise<DiscountRecord | null> {
  if (!code) return null;
  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .ilike('code', code)
      .maybeSingle();
    if (error) {
      warn('lookup failed', error.message);
      return null;
    }
    if (!data) return null;

    const now = Date.now();
    if (data.active === false) return null;
    if (data.starts_at && new Date(data.starts_at).getTime() > now) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() < now) return null;
    if (
      typeof data.max_redemptions === 'number' &&
      typeof data.redemptions === 'number' &&
      data.max_redemptions > 0 &&
      data.redemptions >= data.max_redemptions
    )
      return null;
    log('discount valid', data);
    return data as DiscountRecord;
  } catch (err: any) {
    warn('validation failed', err?.message || err);
    return null;
  }
}
