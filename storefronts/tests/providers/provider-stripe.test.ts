import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleStripe: any;
let createMock: any;
let credsMock: any;

vi.mock('stripe', () => {
  createMock = vi.fn();
  return { default: class { paymentIntents = { create: createMock }; constructor() {} } };
});

vi.mock('../../../shared/checkout/getActiveGatewayCreds.ts', () => {
  credsMock = vi.fn(async () => ({ secret_key: 'sk_test' }));
  return { getActiveGatewayCreds: credsMock };
});

vi.mock('storefronts/features/gateways/stripeGateway.js', () => ({ init: vi.fn() }));
vi.mock('storefronts/features/gateways/authorizeNet.js', () => ({ init: vi.fn() }));
vi.mock('storefronts/features/gateways/paypal.js', () => ({ init: vi.fn() }));
vi.mock('storefronts/features/gateways/nmiGateway.js', () => ({ init: vi.fn() }));
vi.mock('storefronts/features/gateways/segpay.js', () => ({ init: vi.fn() }));

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
  store_id: 'store-1'
};

beforeEach(async () => {
  vi.resetModules();
  await loadModule();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('setup ran with debug mode', () => {
  expect(window.Smoothr?.config?.debug).toBe(true);
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
