import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.window = { SMOOTHR_CONFIG: { baseCurrency: 'EUR', rates: { USD: 1, EUR: 0.8 } } };
});

describe('SMOOTHR_CONFIG integration', () => {
  it('applies base currency and rates on load', async () => {
    const core = await import('../index.js');
    const { currency } = core;
    expect(currency.baseCurrency).toBe('EUR');
    expect(currency.rates.EUR).toBe(0.8);
  });
});
