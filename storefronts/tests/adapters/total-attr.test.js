import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initCurrencyDom,
  setSelectedCurrency
} from '../../adapters/webflow/currencyDomAdapter.js';
import { setBaseCurrency, updateRates } from '../../features/currency/index.js';

class CustomEvt {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
}

describe('data-smoothr-total updates', () => {
  let events;
  let el;
  let store;

  beforeEach(() => {
    setBaseCurrency('USD');
    updateRates({ USD: 1, EUR: 0.5 });

    events = {};
    store = null;
    el = {
      attributes: { 'data-smoothr-total': '20' },
      getAttribute: vi.fn(attr => el.attributes[attr]),
      setAttribute: vi.fn((attr, val) => {
        el.attributes[attr] = String(val);
      }),
      hasAttribute: vi.fn(attr => attr in el.attributes),
      textContent: '',
      dataset: {
        get smoothrBase() {
          return this._smoothrBase;
        },
        set smoothrBase(val) {
          this._smoothrBase = String(val);
        }
      }
    };

    global.localStorage = {
      getItem: vi.fn(() => store),
      setItem: vi.fn((k, v) => {
        store = v;
      })
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
    expect(el.dataset.smoothrBase).toBe('20');

    setSelectedCurrency('EUR');
    expect(el.textContent).toBe('€10.00');
    expect(el.getAttribute('data-smoothr-total')).toBe('10');

    setSelectedCurrency('USD');
    expect(el.textContent).toBe('$20.00');
    expect(el.dataset.smoothrBase).toBe('20');
  });
});
