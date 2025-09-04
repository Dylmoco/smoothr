import { handleSuccessRedirect } from './handleSuccessRedirect.js';
import { getConfig } from '../../config/globalConfig.js';

export default async function gatewayDispatcher(provider, payload, token, log, warn, err) {
  const apiBase = getConfig().apiBase || '';
  log('POST', `${apiBase}/api/checkout/${provider}`);

  if (!apiBase.startsWith('https://')) {
    console.error('[Smoothr Checkout] ❌ apiBase is invalid or missing:', apiBase);
    alert('Checkout is misconfigured. Please refresh the page or contact support.');
    return { res: null, data: null };
  }

  let res;
  try {
    if (provider === 'authorizeNet') {
      const orderPayload = {
        email: payload.email,
        name: `${payload.first_name} ${payload.last_name}`.trim(),
        cart: payload.cart,
        total_price: payload.total,
        currency: payload.currency,
        gateway: provider,
        shipping: payload.shipping,
        billing: payload.billing,
        store_id: payload.store_id
      };
      const orderRes = await fetch(`${apiBase}/api/createOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const orderData = await orderRes.clone().json().catch(() => ({}));
      log('createOrder response', orderRes.status, orderData);
      if (!orderRes.ok || !orderData?.order_number) {
        err('Order creation failed');
        return { res: orderRes, data: orderData };
      }
      const checkoutPayload = { ...payload, order_number: orderData.order_number, payment_method: token };
      res = await fetch(`${apiBase}/api/checkout/authorizeNet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      });
    } else {
      res = await fetch(`${apiBase}/api/checkout/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  } catch (error) {
    console.error('[Smoothr Checkout] ❌ Fetch failed:', error);
    throw error;
  }

  const data = await res.clone().json().catch(() => ({}));
  log('fetch response', res.status, data);
  console.log('[Smoothr Checkout] fetch response', res.status, data);
  if (res.status === 403) {
    console.warn('[Smoothr Auth] Supabase session missing or expired');
  }
  handleSuccessRedirect(res, data);
  return { res, data };
}
