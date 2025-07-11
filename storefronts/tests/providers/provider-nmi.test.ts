import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleNmi: any;
let fetchMock: any;
const originalFetch = global.fetch;
const originalKey = process.env.NMI_SECURITY_KEY;

async function loadModule() {
  const mod = await import('../../../shared/checkout/providers/nmi.ts');
  handleNmi = mod.default;
}

const basePayload = {
  amount: 100,
  payment_token: 'tok_test'
};

beforeEach(async () => {
  vi.resetModules();
  fetchMock = vi.fn(async () => ({ text: async () => 'response=1&transactionid=tx1' }));
  global.fetch = fetchMock as any;
  process.env.NMI_SECURITY_KEY = 'key';
  await loadModule();
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NMI_SECURITY_KEY = originalKey;
  vi.restoreAllMocks();
});

describe('handleNmi', () => {
  it('returns success on response 1', async () => {
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: true, data: { response: '1', transactionid: 'tx1' } });
  });

  it('returns error when missing security key', async () => {
    process.env.NMI_SECURITY_KEY = '';
    const res = await handleNmi(basePayload);
    expect(res).toEqual({ success: false });
  });
});
