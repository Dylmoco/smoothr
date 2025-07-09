import { getStoreIntegration } from '../getStoreIntegration';

const envLoginId = process.env.AUTHNET_API_LOGIN_ID || '';
const envTransactionKey = process.env.AUTHNET_TRANSACTION_KEY || '';

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
  currency?: string;
  store_id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  billing_first_name?: string;
  billing_last_name?: string;
  payment_method: {
    dataDescriptor: string;
    dataValue: string;
  };
  shipping?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  billing?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

export default async function handleAuthorizeNet(payload: AuthorizeNetPayload) {
  try {
    console.log('[AuthorizeNet] 🟢 Handler invoked');
    console.log('🟢 Provider handler invoked');
    console.log('[AuthorizeNet] 🔧 Handler triggered');
    console.log(
      '[AuthorizeNet] Incoming payload:',
      JSON.stringify(payload, null, 2)
    );
  let creds;

  try {
    creds = await getStoreIntegration(payload.store_id, 'authorizeNet');
    console.log('[AuthorizeNet] 🧩 Raw store_integrations:', creds);
  } catch (err) {
    console.error('[AuthorizeNet] ❌ getStoreIntegration() threw:', err);
    return {
      success: false,
      error: 'Failed to load store credentials',
    };
  }

  const { api_login_id, transaction_key } = creds || {};

  console.log('[AuthorizeNet] 🟢 Handler invoked');
  console.log('[AuthorizeNet] 🔑 Credentials check:', {
    api_login_id: !!api_login_id,
    transaction_key: !!transaction_key,
  });

  log('[Authorize.Net] Integration settings pulled:', creds);
  const loginId = api_login_id || (creds as any)?.api_key || envLoginId;
  const transactionKey = transaction_key || envTransactionKey;
  const integrationSource = envLoginId ? 'env' : 'storeIntegration';
  const source = envLoginId ? 'env' : 'store_integrations';
  console.log('[AuthorizeNet] Using credentials from:', integrationSource);
  log('[AuthorizeNet] login_id:', loginId);
  log('[AuthorizeNet] transaction_key:', transactionKey);
  log('[Authorize.Net] Fallback credentials:', {
    envLoginId,
    envTransactionKey,
  });
  log('[Authorize.Net] Selected loginId:', loginId);
  log('[Authorize.Net] Selected transactionKey:', transactionKey);
  console.log('Credential presence:', {
    api_login_id: Boolean(loginId),
    transaction_key: Boolean(transactionKey),
  });
  if (!loginId || !transactionKey) {
    console.warn('[AuthorizeNet] ❌ Missing credentials');
    return { success: false, error: 'Missing credentials' };
  }

  const amount = (payload.total / 100).toFixed(2);

  const shipAddress = payload.shipping?.address || {};
  const billAddress = payload.billing?.address || shipAddress;

  const billName =
    payload.billing?.name ||
    `${payload.billing_first_name || payload.first_name} ${payload.billing_last_name || payload.last_name}`.trim();

  const [billFirst = '', ...billRest] = billName.split(' ');
  const billLast = billRest.join(' ');

  const billTo = {
    firstName: billFirst,
    lastName: billLast,
    address: [billAddress.line1, billAddress.line2].filter(Boolean).join(' ') || '',
    city: billAddress.city || '',
    state: billAddress.state || '',
    zip: billAddress.postal_code || '',
    country: billAddress.country || 'GB',
  };

  const shipTo = {
    firstName: payload.first_name,
    lastName: payload.last_name,
    address: [shipAddress.line1, shipAddress.line2].filter(Boolean).join(' ') || '',
    city: shipAddress.city || '',
    state: shipAddress.state || '',
    zip: shipAddress.postal_code || '',
    country: shipAddress.country || 'GB',
  };

  if (
    !payload.payment_method ||
    !payload.payment_method.dataDescriptor ||
    !payload.payment_method.dataValue
  ) {
    err('Missing payment_method', payload.payment_method);
    return { success: false, error: 'Missing payment_method' };
  }

  const body = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: loginId,
        transactionKey,
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount,
        ...(payload.currency ? { currencyCode: payload.currency } : {}),
        payment: {
          opaqueData: {
            dataDescriptor: payload.payment_method.dataDescriptor,
            dataValue: payload.payment_method.dataValue,
          },
        },
        customer: {
          email: payload.email,
        },
        billTo,
        shipTo,
      },
    },
  };

  console.log('[AuthorizeNet] Building request body...');

  try {
    console.log('[AuthorizeNet] Sending request to:', baseUrl);
    const sanitizedBody = JSON.parse(JSON.stringify(body));
    delete sanitizedBody.createTransactionRequest.transactionRequest.payment.opaqueData
      .dataValue;
    console.log('[AuthorizeNet] 📦 Sending transaction request:', {
      endpoint: baseUrl,
      payload: sanitizedBody,
    });
    console.log('[AuthorizeNet] Request body:', JSON.stringify(sanitizedBody, null, 2));

    let res;
    let text;
    try {
      res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      text = await res.text();
      console.log('[AuthorizeNet] ✅ Gateway response received');
    } catch (err) {
      console.error('[AuthorizeNet] 💥 Caught fetch error:', err);
      return {
        success: false,
        error: 'Network error while contacting Authorize.Net',
        raw: (err as any).message,
      };
    }

    if (!res.ok) {
      console.error('[AuthorizeNet] ❌ HTTP error:', res.status, res.statusText);
    }
    console.log('[AuthorizeNet] ✅ Response status:', res.status);
    console.log('[AuthorizeNet] ✅ Response status text:', res.statusText);

    console.log('[AuthorizeNet] ✅ Response body (raw):', text);
    let json;
    try {
      json = JSON.parse(text);
      console.log('[AuthorizeNet] ✅ Parsed JSON response:', json);
    } catch (e) {
      console.error('[AuthorizeNet] ❌ Failed to parse JSON response:', e);
      return {
        success: false,
        error: 'Non-JSON response from gateway',
        raw: text,
      };
    }

    if (!res.ok || json?.messages?.resultCode !== 'Ok') {
      const message =
        json?.messages?.message?.[0]?.text || 'Unknown error';
      const formattedMessage =
        `The Authorize.Net gateway rejected the transaction: ${message}`;
      console.error('[AuthorizeNet] ❌ Gateway error:', formattedMessage);
      return { success: false, error: formattedMessage, raw: json };
    }

    console.log('[AuthorizeNet] ✅ Gateway approved transaction');
    return {
      success: true,
      data: json,
    };
  } catch (e: any) {
    console.error('[AuthorizeNet] Fatal fetch error:', e);
    return { success: false, error: e?.message || String(e) };
  }
  } catch (e: any) {
    console.error('[AuthorizeNet] Top-level handler crash:', e);
    return {
      success: false,
      error: 'Top-level handler crash',
      details: e?.message
    };
  }
}
