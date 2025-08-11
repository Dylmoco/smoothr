import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleStripe: any;
let createMock: any;
let integrationMock: any;
let supabaseMock: any;

const publishable = process.env.TEST_STRIPE_PUBLISHABLE || 'pk_test';
const secret = process.env.TEST_STRIPE_SECRET || 'sk_test';
const testStoreId = process.env.TEST_STORE_ID || 'store-1';

vi.mock('stripe', () => {
  createMock = vi.fn();
  return { default: class { paymentIntents = { create: createMock }; constructor() {} } };
});

vi.mock('../../../shared/checkout/getStoreIntegration.ts', () => {
  integrationMock = vi.fn(async () => ({ api_key: secret }));
  return { getStoreIntegration: integrationMock };
});

vi.mock('../../../shared/supabase/serverClient', () => {
  supabaseMock = {
    from: (table: string) => {
      if (table === 'store_settings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: { settings: { stripe_secret_key: secret } },
                error: null
              }))
            }))
          }))
        };
      }
      return {} as any;
    }
  };
  return { supabase: supabaseMock, createServerSupabaseClient: () => supabaseMock, testMarker: '✅ serverClient loaded' };
});

async function loadModule() {
  const mod = await import('../../../shared/checkout/providers/stripeProvider.ts');
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
  store_id: testStoreId
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
    expect(res).toEqual({
      success: false,
      transaction_id: null,
      customer_vault_id: null,
      error: 'fail'
    });
  });

  it('returns intent on success', async () => {
    const intent = { id: 'pi_123' };
    createMock.mockResolvedValue(intent);
    const res = await handleStripe(basePayload);
    expect(res).toEqual({
      success: true,
      transaction_id: 'pi_123',
      customer_vault_id: null,
      error: null
    });
  });
});
