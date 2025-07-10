import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertPrice,
  convertCurrency,
  setBaseCurrency,
  updateRates,
  rates,
  baseCurrency
} from '../../core/currency/index.js';

describe('additional conversion logic', () => {
  beforeEach(() => {
    setBaseCurrency('USD');
    updateRates({ USD: 1, EUR: 0.9, GBP: 0.8 });
  });

  it('throws for unsupported currencies', () => {
    expect(() => convertPrice(10, 'AUD', 'USD')).toThrow('Unsupported currency');
  });

  it('merges rates when updating', () => {
    updateRates({ JPY: 140 });
    expect(rates.JPY).toBe(140);
    expect(rates.USD).toBe(1);
  });

  it('alias convertCurrency matches convertPrice', () => {
    const a = convertPrice(10, 'GBP', 'USD');
    const b = convertCurrency(10, 'GBP', 'USD');
    expect(b).toBe(a);
  });

  it('reflects changes to baseCurrency', () => {
    setBaseCurrency('EUR');
    expect(baseCurrency).toBe('EUR');
  });
});
