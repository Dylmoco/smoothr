
import { getStoreIntegration } from '../getStoreIntegration';

const envLoginId = process.env.AUTHNET_API_LOGIN_ID || '';
const envTransactionKey = process.env.AUTHNET_TRANSACTION_KEY || '';
const envClientKey = process.env.AUTHNET_CLIENT_KEY || '';

const env = process.env.AUTHNET_ENV === 'production' ? 'production' : 'sandbox';
const baseUrl =
  env === 'production'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout AuthorizeNet]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout AuthorizeNet]', ...args);

interface AuthorizeNetPayload {
  total: number;
  payment_method: {
    dataDescriptor: string;
    dataValue: string;
  };
  currency?: string;
  store_id: string;
}

export default async function handleAuthorizeNet(payload: AuthorizeNetPayload) {
  const integration = await getStoreIntegration(payload.store_id, 'authorizeNet');
  log('[Authorize.Net] Integration settings pulled:', integration);
  const loginId =
    integration?.settings?.api_login_id || integration?.api_key || envLoginId;
  const transactionKey =
    integration?.settings?.transaction_key || envTransactionKey;
  const clientKey =
    integration?.settings?.client_key || envClientKey;
  log('[Authorize.Net] Fallback credentials:', {
    envLoginId,
    envTransactionKey,
    envClientKey,
  });
  log('[Authorize.Net] Selected loginId:', loginId);
  log('[Authorize.Net] Selected transactionKey:', transactionKey);
  if (!loginId.trim() || !transactionKey.trim()) {
    err('Missing Authorize.Net credentials');
    return { success: false, error: 'Missing credentials' };
  }
  const body = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: loginId,
        transactionKey
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: payload.total,
        ...(payload.currency ? { currencyCode: payload.currency } : {}),
        payment: {
          opaqueData: {
            dataDescriptor: payload.payment_method.dataDescriptor,
            dataValue: payload.payment_method.dataValue
          }
        }
      }
    }
  };

  try {
    log('[AuthorizeNet] Sending request to:', baseUrl);
    log('[AuthorizeNet] Request body:', JSON.stringify(body, null, 2));

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const status = res.status;
    const text = await res.text();

    console.log('[AuthorizeNet] Response status:', status);
    console.log('[AuthorizeNet] Response body:', text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error('[AuthorizeNet] Non-JSON response from gateway');
      return {
        success: false,
        error: `Non-JSON response with status ${status}`,
        raw: text
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: json?.messages?.message?.[0]?.text || `Error from gateway`,
        raw: json,
        status
      };
    }

    return {
      success: true,
      data: json
    };
  } catch (e: any) {
    console.error('[AuthorizeNet] Fatal fetch error:', e);
    return { success: false, error: e?.message || String(e) };
  }
}
