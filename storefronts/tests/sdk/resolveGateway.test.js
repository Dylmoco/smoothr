// [Codex Fix] Added to test gateway resolution logic
import { describe, it, expect } from 'vitest';
import resolveGateway from '../../../core/utils/resolveGateway.js';

describe('resolveGateway', () => {
  it('prefers config.active_payment_gateway', () => {
    const provider = resolveGateway({ active_payment_gateway: 'stripe' }, {});
    expect(provider).toBe('stripe');
  });

  it('uses storeSettings.active_payment_gateway when config missing', () => {
    const provider = resolveGateway({}, { active_payment_gateway: 'paypal' });
    expect(provider).toBe('paypal');
  });

  it('throws when only nested settings value exists', () => {
    expect(() =>
      resolveGateway({}, { settings: { active_payment_gateway: 'stripe' } })
    ).toThrow('active_payment_gateway not configured');
  });
});
