import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleStripe: any;
let createMock: any;
let integrationMock: any;

vi.mock('stripe', () => {
  createMock = vi.fn();
  return { default: class { paymentIntents = { create: createMock }; constructor() {} } };
});

vi.mock('../../../shared/checkout/getStoreIntegration.ts', () => {
  integrationMock = vi.fn(async () => ({ api_key: 'sk_test' }));
  return { getStoreIntegration: integrationMock };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/providers/stripe.ts');
  handleStripe = mod.default;
}

const basePayload = {
  payment_method: 'pm_123',
  email: 'user@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  shipping: {
    name: 'Jane Doe',
    address: {
      line1: '123 St',
      city: 'Town',
      state: 'TX',
      postal_code: '75001',
      country: 'US'
    }
  },
  cart: [],
  total: 1000,
  currency: 'USD',
  description: 'Test',
  metaCartString: 'cart',
  store_id: 'store-1'
};

beforeEach(async () => {
  vi.resetModules();
  await loadModule();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('handleStripe', () => {
  it('returns error when Stripe throws', async () => {
    createMock.mockRejectedValue(new Error('fail'));
    const res = await handleStripe(basePayload);
    expect(res).toEqual({ success: false, error: 'fail' });
  });

  it('returns intent on success', async () => {
    const intent = { id: 'pi_123' };
    createMock.mockResolvedValue(intent);
    const res = await handleStripe(basePayload);
    expect(res).toEqual({ success: true, transaction_id: 'pi_123' });
    expect(integrationMock).toHaveBeenCalledWith('store-1', 'stripe');
  });
});
