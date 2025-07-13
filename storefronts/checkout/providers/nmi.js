import { getPublicCredential } from '../getPublicCredential.js';

let cachedKey;

const DEBUG = !!window.SMOOTHR_CONFIG?.debug;
const log = (...a) => DEBUG && console.log('[NMI]', ...a);
const warn = (...a) => DEBUG && console.warn('[NMI]', ...a);

export async function resolveTokenizationKey() {
  if (cachedKey !== undefined) return cachedKey;
  const storeId = window.SMOOTHR_CONFIG?.storeId;
  if (!storeId) return null;

  const gateway = window.SMOOTHR_CONFIG?.active_payment_gateway || 'nmi';

  try {
    const cred = await getPublicCredential(storeId, 'nmi', gateway);
    cachedKey = cred?.settings?.tokenization_key || null;
  } catch (e) {
    warn('Integration fetch error:', e?.message || e);
    cachedKey = null;
  }

  if (!cachedKey) {
    warn('No tokenization key found for gateway', gateway);
    return null;
  }

  log('Using tokenization key resolved');
  return cachedKey;
}
