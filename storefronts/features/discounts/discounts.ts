import { getConfig } from '../config/globalConfig.js';
import { apiFetch } from '../../../shared/utils/apiFetch.js';

const debug = typeof window !== 'undefined' && getConfig().debug;
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

export async function applyDiscount(code: string): Promise<DiscountRecord | null> {
  if (!code) return null;
  try {
    const config = getConfig();
    const store_id = config.storeId;
    const apiBase = config.apiBase || '';
    const customer_id = window.smoothr?.auth?.user?.value?.id || null;
    const total = window.Smoothr?.cart?.getSubtotal?.() || 0;

    const data = await apiFetch(`${apiBase}/api/checkout`, {
      method: 'POST',
      body: { store_id, customer_id, discount_code: code, total },
    });

    if (data?.valid && data.discount) {
      window.Smoothr?.cart?.applyDiscount?.({
        code,
        type: data.discount.type,
        amount:
          typeof data.discount.value_cents === 'number'
            ? data.discount.value_cents
            : data.discount.percent,
      });
      log('discount valid', data.discount);
      return { id: '', code, type: data.discount.type, amount: data.discount.value_cents ?? data.discount.percent } as DiscountRecord;
    }
    return null;
  } catch (err: any) {
    warn('applyDiscount failed', err?.message || err);
    return null;
  }
}
