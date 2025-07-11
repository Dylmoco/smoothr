import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleNmi: any;
let integrationMock: any;
let fetchMock: any;
const originalFetch = global.fetch;

vi.mock('../../../shared/checkout/getStoreIntegration.ts', () => {
  integrationMock = vi.fn(async () => ({ api_key: 'key' }));
  return { getStoreIntegration: integrationMock };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/providers/nmi.ts');
  handleNmi = mod.default;
}

const basePayload = {
  amount: 100,
  payment_token: 'tok_test',
  store_id: 'store-1'
};

beforeEach(async () => {
  vi.resetModules();
  fetchMock = vi.fn(async () => ({ text: async () => 'response=1&transactionid=tx1' }));
  global.fetch = fetchMock as any;
  await loadModule();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('handleNmi', () => {
  it('returns success on response 1', async () => {
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: true, data: { response: '1', transactionid: 'tx1' } });
    expect(integrationMock).toHaveBeenCalledWith('store-1', 'nmi');
  });

  it('returns error when missing security key', async () => {
    integrationMock.mockResolvedValue(null);
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: false, error: 'Missing credentials' });
  });
});
