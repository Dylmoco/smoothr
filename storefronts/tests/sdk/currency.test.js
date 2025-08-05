import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as currency from '../../features/currency/index.js';

const { formatPrice, convertPrice, setBaseCurrency, updateRates, init } = currency;

describe('currency utilities', () => {
  beforeEach(async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
    );
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    await init({ baseCurrency: 'USD' });
    updateRates({ USD: 1, EUR: 0.9, GBP: 0.8 });
  });

  it('formats numbers as currency', () => {
    expect(formatPrice(10, 'USD')).toBe('$10.00');
  });

  it('converts between currencies', () => {
    const euros = convertPrice(10, 'EUR', 'USD');
    expect(euros).toBeCloseTo(9);
  });

  it('uses the base currency by default', () => {
    setBaseCurrency('EUR');
    updateRates({ USD: 1.2, EUR: 1 });
    expect(convertPrice(10, 'USD')).toBeCloseTo(12);
  });
});
