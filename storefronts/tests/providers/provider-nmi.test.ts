import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleNmi: any;
let fetchMock: any;
let credsMock: any;
const originalFetch = global.fetch;
const originalKey = process.env.NMI_SECURITY_KEY;

vi.mock('../../../shared/checkout/getActiveGatewayCreds.ts', () => {
  credsMock = vi.fn(async () => ({ secret_key: 'key' }));
  return { getActiveGatewayCreds: credsMock };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/providers/nmi.ts');
  handleNmi = mod.default;
}

const basePayload = {
  amount: 100,
  payment_token: 'tok_test',
  store_id: 'store-1',
  cart: []
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
    expect(res.customer_vault_id).toBeNull();
    expect(credsMock).toHaveBeenCalledWith('store-1', 'nmi');
    const body = fetchMock.mock.calls[0][1].body;
    const params = new URLSearchParams(body);
    expect(params.get('security_key')).toBe('key');
    expect(params.get('amount')).toBe('1.00');
  });

  it('falls back to env security key when integration missing', async () => {
    credsMock.mockResolvedValue(null);
    process.env.NMI_SECURITY_KEY = 'envKey';
    const res = await handleNmi(basePayload);
    const params = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(params.get('security_key')).toBe('envKey');
    expect(params.get('amount')).toBe('1.00');
    expect(credsMock).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.transaction_id).toBe('tx1');
  });

  it('returns error when no security key found', async () => {
    credsMock.mockResolvedValue(null);
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: false, error: 'Missing security key' });
  });

  it('prefers token over customer_profile_id', async () => {
    const res = await handleNmi({
      ...basePayload,
      payment_token: 'tok_x',
      customer_profile_id: 'vault123'
    });
    expect(res.success).toBe(true);
    const params = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(params.get('payment_token')).toBe('tok_x');
    expect(params.get('customer_vault')).toBe('add_customer');
    expect(params.get('customer_vault_id')).toBeNull();
  });

  it('errors when token and vault id missing', async () => {
    await expect(
      handleNmi({
        ...basePayload,
        payment_token: undefined as any
      })
    ).rejects.toThrow('Missing payment credentials');
  });
});
