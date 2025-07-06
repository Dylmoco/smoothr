
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
  amount: number;
  payment: {
    dataDescriptor: string;
    dataValue: string;
  };
  currency?: string;
  store_id: string;
}

export default async function handleAuthorizeNet(payload: AuthorizeNetPayload) {
  const integration = await getStoreIntegration(payload.store_id, 'authorizeNet');
  const loginId =
    integration?.settings?.api_login_id || integration?.api_key || envLoginId;
  const transactionKey =
    integration?.settings?.transaction_key || envTransactionKey;
  const clientKey =
    integration?.settings?.client_key || envClientKey;
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
        amount: payload.amount,
        ...(payload.currency ? { currencyCode: payload.currency } : {}),
        payment: {
          opaqueData: {
            dataDescriptor: payload.payment.dataDescriptor,
            dataValue: payload.payment.dataValue
          }
        }
      }
    }
  };

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    log('AuthorizeNet response:', JSON.stringify(json));

    if (json.messages?.resultCode === 'Ok') {
      const transactionId = json.transactionResponse?.transId;
      return { success: true, intent: { id: transactionId } };
    }

    const message =
      json.transactionResponse?.errors?.error?.[0]?.errorText ||
      json.messages?.message?.[0]?.text ||
      'Unknown error';
    return { success: false, error: message };
  } catch (e: any) {
    err('AuthorizeNet error:', e?.message || e);
    return { success: false, error: e?.message || String(e) };
  }
}
