import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleAuthorizeNet: any;
let integrationMock: any;
let fetchMock: any;
const originalFetch = global.fetch;

vi.mock('../../../shared/checkout/getStoreIntegration.ts', () => {
  integrationMock = vi.fn(async () => ({
    api_login_id: 'fakeLogin',
    transaction_key: 'fakeKey',
    settings: {
      api_login_id: 'fakeLogin',
      transaction_key: 'fakeKey',
      client_key: 'client'
    }
  }));
  return { getStoreIntegration: integrationMock };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/providers/authorizeNet.ts');
  handleAuthorizeNet = mod.default;
}

const basePayload = {
  total: 100,
  payment_method: { dataDescriptor: 'desc', dataValue: 'val' },
  currency: 'USD',
  store_id: 'store-1'
};

beforeEach(async () => {
  vi.resetModules();
  fetchMock = vi.fn();
  global.fetch = fetchMock as any;
  await loadModule();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('handleAuthorizeNet', () => {
  it('returns error when request fails', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    const res = await handleAuthorizeNet(basePayload);
    expect(res).toEqual({
      success: false,
      error: 'Network error while contacting Authorize.Net',
      raw: 'fail'
    });
  });

  it('returns data on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          messages: { resultCode: 'Ok' },
          transactionResponse: { transId: 't1' }
        })
    });
    const res = await handleAuthorizeNet(basePayload);
    expect(res).toEqual({
      success: true,
      data: { messages: { resultCode: 'Ok' }, transactionResponse: { transId: 't1' } }
    });
    expect(integrationMock).toHaveBeenCalledWith('store-1', 'authorizeNet');
  });

  it('returns success false on non-Ok result code', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          messages: { resultCode: 'Error' }
        })
    });
    const res = await handleAuthorizeNet(basePayload);
    expect(res.success).toBe(false);
  });

  it('returns error when payment_method missing', async () => {
    const payload: any = { ...basePayload };
    delete payload.payment_method;
    const res = await handleAuthorizeNet(payload);
    expect(res).toEqual({ success: false, error: 'Missing payment_method' });
  });

  it('returns error when payment_method is incomplete', async () => {
    const payload: any = { ...basePayload, payment_method: { dataDescriptor: 'desc' } };
    const res = await handleAuthorizeNet(payload);
    expect(res).toEqual({ success: false, error: 'Missing payment_method' });
  });

  it('sends billing details when provided', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ messages: { resultCode: 'Ok' }, transactionResponse: {} })
    });
    const payload = {
      ...basePayload,
      email: 'user@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      shipping: {
        name: 'Jane Doe',
        address: { line1: '1 Ship', city: 'Ship', state: 'ST', postal_code: 'S1', country: 'US' }
      },
      billing: {
        name: 'Bill Buyer',
        address: { line1: '1 Bill', city: 'Billtown', state: 'BL', postal_code: 'B1', country: 'US' }
      }
    };
    await handleAuthorizeNet(payload);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.createTransactionRequest.transactionRequest.billTo).toEqual({
      firstName: 'Bill',
      lastName: 'Buyer',
      address: '1 Bill',
      city: 'Billtown',
      state: 'BL',
      zip: 'B1',
      country: 'US'
    });
  });

  it('uses credentials from store_integrations.settings', async () => {
    integrationMock.mockResolvedValue({
      settings: { api_login_id: 'id1', transaction_key: 'key1' }
    });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ messages: { resultCode: 'Ok' }, transactionResponse: {} })
    });
    await handleAuthorizeNet(basePayload);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.createTransactionRequest.merchantAuthentication).toEqual({
      name: 'id1',
      transactionKey: 'key1'
    });
  });

  it('returns error when credentials missing', async () => {
    integrationMock.mockResolvedValue({ settings: {} });
    const res = await handleAuthorizeNet(basePayload);
    expect(res).toEqual({
      success: false,
      error: 'Missing Authorize.Net credentials for store',
      status: 400
    });
  });
});
