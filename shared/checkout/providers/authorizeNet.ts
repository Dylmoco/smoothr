
const loginId = process.env.AUTHORIZE_NET_LOGIN_ID || '';
const transactionKey = process.env.AUTHORIZE_NET_TRANSACTION_KEY || '';

const debug = process.env.SMOOTHR_DEBUG === 'true';
const log = (...args: any[]) => debug && console.log('[Checkout AuthorizeNet]', ...args);
const err = (...args: any[]) => debug && console.error('[Checkout AuthorizeNet]', ...args);

interface AuthorizeNetPayload {
  amount: number;
  payment: {
    cardNumber: string;
    expirationDate: string;
    cardCode: string;
  };
  currency?: string;
}

export default async function handleAuthorizeNet(payload: AuthorizeNetPayload) {
  const body = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: loginId,
        transactionKey
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: payload.amount,
        payment: {
          creditCard: {
            cardNumber: payload.payment.cardNumber,
            expirationDate: payload.payment.expirationDate,
            cardCode: payload.payment.cardCode
          }
        }
      }
    }
  };

  try {
    const res = await fetch('https://apitest.authorize.net/xml/v1/request.api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    log('AuthorizeNet response:', JSON.stringify(json));

    if (json.messages?.resultCode === 'Ok') {
      const url = json.transactionResponse?.secureAcceptance?.secureAcceptanceUrl;
      return { success: true, ...(url ? { checkoutUrl: url } : {}) };
    }

    const message = json.messages?.message?.[0]?.text || 'Unknown error';
    return { success: false, error: message };
  } catch (e: any) {
    err('AuthorizeNet error:', e?.message || e);
    return { success: false, error: e?.message || String(e) };
  }
}
