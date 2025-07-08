
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
  console.log('[AuthorizeNet] \ud83d\udd27 Handler triggered');
  console.log('[AuthorizeNet] Incoming payload:', JSON.stringify(payload, null, 2));
  const integration = await getStoreIntegration(payload.store_id, 'authorizeNet');
  log('[Authorize.Net] Integration settings pulled:', integration);
  const loginId =
    integration?.settings?.api_login_id || integration?.api_key || envLoginId;
  const transactionKey =
    integration?.settings?.transaction_key || envTransactionKey;
  const clientKey =
    integration?.settings?.client_key || envClientKey;
  const integrationSource = envLoginId ? 'env' : 'storeIntegration';
  console.log('[AuthorizeNet] Using credentials from:', integrationSource);
  console.log('[AuthorizeNet] login_id:', loginId);
  console.log('[AuthorizeNet] transaction_key:', transactionKey);
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

  console.log('[AuthorizeNet] Building request body...');

  try {
    console.log('[AuthorizeNet] Sending request to:', baseUrl);
    console.log('[AuthorizeNet] Request body:', JSON.stringify(body, null, 2));

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    console.log('[AuthorizeNet] \u2705 Response status:', res.status);
    console.log('[AuthorizeNet] \u2705 Response body (raw):', text);

    let json;
    try {
      json = JSON.parse(text);
      console.log('[AuthorizeNet] \u2705 Parsed JSON response:', json);
    } catch (e) {
      console.error('[AuthorizeNet] \u274c Failed to parse JSON response:', e);
      return {
        success: false,
        error: 'Non-JSON response from gateway',
        raw: text
      };
    }

    if (!res.ok) {
      console.error(
        '[AuthorizeNet] \u274c Gateway rejected:',
        json?.messages?.message?.[0]?.text || 'Unknown error'
      );
      return {
        success: false,
        error: json?.messages?.message?.[0]?.text || 'Unknown error',
        raw: json
      };
    }

    console.log('[AuthorizeNet] \u2705 Gateway approved transaction');
    return {
      success: true,
      data: json
    };
  } catch (e: any) {
    console.error('[AuthorizeNet] Fatal fetch error:', e);
    return { success: false, error: e?.message || String(e) };
  }
}
