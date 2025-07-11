import { getStoreIntegration } from '../getStoreIntegration';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout NMI]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout NMI]', ...args);

interface NmiPayload {
  amount: number;
  ccnumber: string;
  ccexp: string;
  cvv?: string;
  store_id: string;
}

export default async function handleNmi(payload: NmiPayload) {
  const integration = await getStoreIntegration(payload.store_id, 'nmi');
  const securityKey =
    integration?.settings?.security_key ||
    integration?.api_key ||
    process.env.NMI_SECURITY_KEY ||
    '';

  if (!securityKey.trim()) {
    console.warn('[Checkout NMI] Missing security key for store', payload.store_id);
    return { success: false, error: 'Missing credentials' };
  }

  const params = new URLSearchParams({
    security_key: securityKey,
    type: 'sale',
    amount: (payload.amount / 100).toFixed(2),
    ccnumber: payload.ccnumber,
    ccexp: payload.ccexp
  });
  if (payload.cvv) params.append('cvv', payload.cvv);

  try {
    const res = await fetch(
      'https://secure.networkmerchants.com/api/transact.php',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }
    );
    const text = await res.text();
    log('NMI response:', text);
    const data = Object.fromEntries(
      text.split('&').map(part => part.split('=') as [string, string])
    );
    if (data.response === '1') return { success: true };
    return { success: false, error: decodeURIComponent(data.responsetext || '') };
  } catch (e: any) {
    err('NMI error:', e?.message || e);
    return { success: false, error: e?.message || String(e) };
  }
}
