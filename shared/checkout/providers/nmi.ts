const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout NMI]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout NMI]', ...args);

import { getStoreIntegration } from '../getStoreIntegration';

interface NmiPayload {
  payment_token: string;
  amount: number;
  store_id: string;
}

export default async function handleNmi(payload: NmiPayload) {
  let securityKey = process.env.NMI_SECURITY_KEY || '';

  if (!securityKey.trim()) {
    try {
      const creds = await getStoreIntegration(payload.store_id, 'nmi');
      securityKey = creds?.settings?.api_key || creds?.api_key || '';
    } catch (e) {
      err('getStoreIntegration error:', e);
    }
  }

  if (!securityKey.trim()) {
    console.warn('[Checkout NMI] Missing security key');
    return { success: false };
  }

  const params = new URLSearchParams({
    security_key: securityKey,
    type: 'sale',
    amount: (payload.amount / 100).toFixed(2),
    payment_token: payload.payment_token
  });

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
    if (data.response === '1') return { success: true, data };
    return { success: false, data };
  } catch (e: any) {
    err('NMI error:', e?.message || e);
    return { success: false };
  }
}
