import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleAuthorizeNet: any;
let integrationMock: any;
let fetchMock: any;
const originalFetch = global.fetch;

vi.mock('../../../shared/checkout/getStoreIntegration.ts', () => {
  integrationMock = vi.fn(async () => ({
    api_key: 'login',
    settings: { transaction_key: 'key', client_key: 'client' }
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
    expect(res).toEqual({ success: false, error: 'fail' });
  });

  // it('returns intent on success', async () => {
  //   fetchMock.mockResolvedValue({
  //     json: async () => ({
  //       messages: { resultCode: 'Ok' },
  //       transactionResponse: { transId: 't1' }
  //     })
  //   });
  //   const res = await handleAuthorizeNet(basePayload);
  //   expect(res).toEqual({ success: true, intent: { id: 't1' } });
  //   expect(integrationMock).toHaveBeenCalledWith('store-1', 'authorizeNet');
  // });
});
