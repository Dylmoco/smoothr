import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initCurrencyDom } from '../webflow-dom.js';
import { setBaseCurrency, updateRates } from '../../core/currency/index.js';

class CustomEvt {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
}

describe('data-smoothr-total updates', () => {
  let events;
  let el;

  beforeEach(() => {
    setBaseCurrency('USD');
    updateRates({ USD: 1, EUR: 0.5 });

    events = {};
    el = {
      attributes: { 'data-smoothr-total': '20' },
      getAttribute: vi.fn(attr => el.attributes[attr]),
      setAttribute: vi.fn((attr, val) => {
        el.attributes[attr] = String(val);
      }),
      hasAttribute: vi.fn(attr => attr in el.attributes),
      textContent: '',
      dataset: {}
    };

    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn()
    };

    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        events[evt] = cb;
      }),
      querySelectorAll: vi.fn(() => [el]),
      dispatchEvent: vi.fn(ev => {
        events[ev.type]?.(ev);
      })
    };

    global.window = {
      location: { origin: '', href: '', hostname: '' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    global.CustomEvent = CustomEvt;

    initCurrencyDom();
  });

  it('converts totals on currency change', () => {
    expect(el.textContent).toBe('$20.00');
    const evt = new CustomEvt('smoothr:currencychange', { detail: { currency: 'EUR' } });
    events['smoothr:currencychange'](evt);
    expect(el.textContent).toBe('€10.00');
    expect(el.getAttribute('data-smoothr-total')).toBe('10');
  });
});
