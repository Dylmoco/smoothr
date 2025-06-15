import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatPrice,
  convertPrice,
  setBaseCurrency,
  updateRates
} from '../index.js';

describe('currency utilities', () => {
  beforeEach(() => {
    setBaseCurrency('USD');
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
