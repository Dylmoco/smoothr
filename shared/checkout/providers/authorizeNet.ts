import { getStoreIntegration } from '../getStoreIntegration';

const env = process.env.AUTHNET_ENV === 'production' ? 'production' : 'sandbox';
const baseUrl =
  env === 'production'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout AuthorizeNet]', ...args);
const warn = (...args: any[]) => debug && console.warn('[Checkout AuthorizeNet]', ...args);
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
    log('🟢 Handler invoked');
    log('🟢 Provider handler invoked');
    log('🔧 Handler triggered');
    log('[AuthorizeNet] Incoming payload:', JSON.stringify(payload, null, 2));
    
    let creds;

    try {
      creds = await getStoreIntegration(payload.store_id, 'authorizeNet');
      log('🧩 Raw integrations:', creds);
    } catch (e) {
      err('❌ getStoreIntegration() threw:', e);
      return {
        success: false,
        error: 'Failed to load store credentials',
      };
    }

    const settings = creds?.settings || {};

    let loginId = '';
    let loginIdSource = '';
    if (typeof settings.api_login_id === 'string' && settings.api_login_id.trim()) {
      loginId = settings.api_login_id.trim();
      loginIdSource = 'integrations.settings';
    } else if (typeof creds?.api_login_id === 'string' && creds.api_login_id.trim()) {
      loginId = creds.api_login_id.trim();
      loginIdSource = 'integrations';
    } else if (typeof (creds as any)?.api_key === 'string' && (creds as any).api_key.trim()) {
      loginId = (creds as any).api_key.trim();
      loginIdSource = 'integrations.publishable_key';
    }

    let transactionKey = '';
    let transactionKeySource = '';
    if (typeof settings.transaction_key === 'string' && settings.transaction_key.trim()) {
      transactionKey = settings.transaction_key.trim();
      transactionKeySource = 'integrations.settings';
    } else if (typeof creds?.transaction_key === 'string' && creds.transaction_key.trim()) {
      transactionKey = creds.transaction_key.trim();
      transactionKeySource = 'integrations';
    }

    log('🧾 Final credentials used:', {
      loginId,
      loginIdSource,
      transactionKey,
      transactionKeySource,
    });

    if (!loginId || !transactionKey) {
      warn('❌ Missing Authorize.Net credentials for store');
      return {
        success: false,
        error: 'Missing Authorize.Net credentials for store',
        status: 400,
      };
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

    log('Building request body...');

    try {
      log('Sending request to:', baseUrl);
      const sanitizedBody = JSON.parse(JSON.stringify(body));
      delete sanitizedBody.createTransactionRequest.transactionRequest.payment.opaqueData
        .dataValue;
      log('📦 Sending transaction request:', {
        endpoint: baseUrl,
        payload: sanitizedBody,
      });
      log('Request body:', JSON.stringify(sanitizedBody, null, 2));

      let res;
      let text;
      try {
        res = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        text = await res.text();
        log('✅ Gateway response received');
    } catch (e) {
      err('💥 Caught fetch error:', e);
      return {
        success: false,
        error: 'Network error while contacting Authorize.Net',
        raw: (e as any).message,
      };
    }

      if (!res.ok) {
        err('❌ HTTP error:', res.status, res.statusText);
      }
      log('✅ Response status:', res.status);
      log('✅ Response status text:', res.statusText);

      log('✅ Response body (raw):', text);
      let json;
      try {
        json = JSON.parse(text);
        log('✅ Parsed JSON response:', json);
      } catch (e) {
        err('❌ Failed to parse JSON response:', e);
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
        err('❌ Gateway error:', formattedMessage);
        return { success: false, error: formattedMessage, raw: json };
      }

      log('✅ Gateway approved transaction');
      return {
        success: true,
        data: json,
      };
    } catch (e: any) {
      err('Fatal fetch error:', e);
      return { success: false, error: e?.message || String(e) };
    }
  } catch (e: any) {
    err('Top-level handler crash:', e);
    return {
      success: false,
      error: 'Top-level handler crash',
      details: e?.message
    };
  }
}