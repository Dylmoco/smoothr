import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDomStub } from '../utils/dom-stub';

vi.mock('../../features/currency/fetchLiveRates.js', () => ({
  fetchExchangeRates: vi.fn().mockResolvedValue({})
}));

describe('currency loader idempotency', () => {
    let realDocument;
    beforeEach(() => {
      vi.resetModules();
      global.window = {};
      realDocument = global.document;
      global.document = createDomStub({
        readyState: 'complete',
        addEventListener: vi.fn(),
        querySelectorAll: vi.fn(() => [])
      });
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
    });

    afterEach(() => {
      global.document = realDocument;
    });

  it('allows multiple loader calls without reinitializing', async () => {
    const currency = await import('../../features/currency/index.js');
    const first = await currency.init({ baseCurrency: 'USD' });
    const second = await currency.init({ baseCurrency: 'USD' });
    expect(second).toBe(first);
    expect(global.document.addEventListener).toHaveBeenCalledTimes(1);
  });
});
