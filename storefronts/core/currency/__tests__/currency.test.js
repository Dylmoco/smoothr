import { describe, it, expect } from 'vitest';
import { formatCurrency, convertCurrency } from '../index.js';

describe('currency utilities', () => {
  it('formats numbers as currency', () => {
    expect(formatCurrency(10, 'USD')).toBe('$10.00');
  });

  it('converts between currencies', () => {
    const euros = convertCurrency(10, 'USD', 'EUR');
    expect(euros).toBeCloseTo(9);
  });
});
