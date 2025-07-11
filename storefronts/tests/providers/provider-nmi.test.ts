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
  fetchMock = vi.fn(async () => ({
    text: async () =>
      'response=1&transactionid=tx1&responsetext=APPROVED+OK'
  }));
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
  it('uses store integration before env key', async () => {
    process.env.NMI_SECURITY_KEY = 'envKey';
    const res = await handleNmi(basePayload);
    expect(res.success).toBe(true);
    expect(res.transaction_id).toBe('tx1');
    expect(res.data).toBeInstanceOf(URLSearchParams);
    expect(res.data.get('responsetext')).toBe('APPROVED OK');
    expect(integrationMock).toHaveBeenCalledWith('store-1', 'nmi');
    const body = fetchMock.mock.calls[0][1].body;
    const params = new URLSearchParams(body);
    expect(params.get('security_key')).toBe('key');
  });

  it('falls back to env security key when integration missing', async () => {
    integrationMock.mockResolvedValue(null);
    process.env.NMI_SECURITY_KEY = 'envKey';
    const res = await handleNmi(basePayload);
    const params = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(params.get('security_key')).toBe('envKey');
    expect(integrationMock).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.transaction_id).toBe('tx1');
  });

  it('returns error when no security key found', async () => {
    integrationMock.mockResolvedValue(null);
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: false, error: 'Missing security key' });
  });
});
