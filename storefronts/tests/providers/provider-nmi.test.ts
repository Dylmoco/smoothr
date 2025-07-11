import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleNmi: any;
let fetchMock: any;
let integrationMock: any;
const originalFetch = global.fetch;
const originalKey = process.env.NMI_SECURITY_KEY;

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
  process.env.NMI_SECURITY_KEY = '';
  await loadModule();
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NMI_SECURITY_KEY = originalKey;
  vi.restoreAllMocks();
});

describe('handleNmi', () => {
  it('uses credentials from store integration', async () => {
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: true, data: { response: '1', transactionid: 'tx1' } });
    expect(integrationMock).toHaveBeenCalledWith('store-1', 'nmi');
    const body = fetchMock.mock.calls[0][1].body;
    const params = new URLSearchParams(body);
    expect(params.get('security_key')).toBe('key');
    expect(params.get('payment_token')).toBe('tok_test');
    expect(params.get('amount')).toBe('1.00');
  });

  it('returns error when credentials missing', async () => {
    integrationMock.mockResolvedValue(null);
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: false });
  });

  it('uses env security key when provided', async () => {
    process.env.NMI_SECURITY_KEY = 'envKey';
    const res = await handleNmi(basePayload);
    const params = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(params.get('security_key')).toBe('envKey');
    expect(integrationMock).not.toHaveBeenCalled();
    expect(res.success).toBe(true);
  });
});
