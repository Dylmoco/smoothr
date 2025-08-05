// [Codex Fix] Added to test gateway resolution logic
import { describe, it, expect, afterEach } from 'vitest';
import resolveGateway from '../../checkout/utils/resolveGateway.js';

describe('resolveGateway', () => {
  afterEach(() => {
    delete window.SMOOTHR_CONFIG;
  });

  it('prefers config.active_payment_gateway', () => {
    window.SMOOTHR_CONFIG = { active_payment_gateway: 'stripe' };
    const provider = resolveGateway(() => {}, () => {});
    expect(provider).toBe('stripe');
  });

  it('uses storeSettings.active_payment_gateway when config missing', () => {
    window.SMOOTHR_CONFIG = { active_payment_gateway: 'paypal' };
    const provider = resolveGateway(() => {}, () => {});
    expect(provider).toBe('paypal');
  });

  it('throws when only nested settings value exists', () => {
    window.SMOOTHR_CONFIG = { settings: { active_payment_gateway: 'stripe' } };
    expect(() => resolveGateway(() => {}, () => {})).toThrow(
      'active_payment_gateway not configured'
    );
  });
});
