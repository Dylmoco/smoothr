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
    if (cred?.api_key) {
      cachedKey = cred.api_key;
    } else if (cred?.tokenization_key) {
      cachedKey = cred.tokenization_key;
    } else if (cred?.settings?.tokenization_key) {
      warn('tokenization_key is deprecated – update integration to use api_key');
      cachedKey = cred.settings.tokenization_key;
    } else {
      cachedKey = null;
    }
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
