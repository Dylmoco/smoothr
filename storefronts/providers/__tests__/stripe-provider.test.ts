import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handleStripe: any;
let createMock: any;

vi.mock('stripe', () => {
  createMock = vi.fn();
  return { default: class { paymentIntents = { create: createMock }; constructor() {} } };
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
  metaCartString: 'cart'
};

beforeEach(async () => {
  vi.resetModules();
  process.env.STRIPE_SECRET_KEY = 'sk_test';
  await loadModule();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.STRIPE_SECRET_KEY;
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
    expect(res).toEqual({ success: true, intent });
  });
});
