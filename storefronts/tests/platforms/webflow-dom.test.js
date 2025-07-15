import { describe, it, expect, beforeEach, vi } from "vitest";
import { setSelectedCurrency, initCurrencyDom } from "../../platforms/webflow/webflow-dom.js";
import { setBaseCurrency, updateRates } from "../../core/currency/index.js";

class CustomEvt {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
}

describe("webflow adapter price replacement", () => {
  let events;
  let els;
  let store;

  beforeEach(() => {
    setBaseCurrency("USD");
    updateRates({ USD: 1, EUR: 0.5 });

    store = null;
    global.localStorage = {
      getItem: vi.fn(() => store),
      setItem: vi.fn((k, v) => {
        store = v;
      }),
    };

    events = {};
    els = [
      {
        attributes: { "data-smoothr-price": "10" },
        getAttribute: vi.fn(function (attr) {
          return this.attributes[attr];
        }),
        setAttribute: vi.fn(function (attr, val) {
          this.attributes[attr] = String(val);
        }),
        hasAttribute: vi.fn(function (attr) {
          return attr in this.attributes;
        }),
        textContent: "",
        dataset: {},
      },
      {
        attributes: { "data-smoothr-price": "20.5" },
        getAttribute: vi.fn(function (attr) {
          return this.attributes[attr];
        }),
        setAttribute: vi.fn(function (attr, val) {
          this.attributes[attr] = String(val);
        }),
        hasAttribute: vi.fn(function (attr) {
          return attr in this.attributes;
        }),
        textContent: "",
        dataset: {},
      },
    ];

    global.document = {
      addEventListener: vi.fn((evt, cb) => {
        events[evt] = cb;
      }),
      querySelectorAll: vi.fn(() => els),
      dispatchEvent: vi.fn((ev) => {
        events[ev.type]?.(ev);
      }),
    };
    global.window = {
      location: { origin: "", href: "", hostname: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.CustomEvent = CustomEvt;

    initCurrencyDom();
  });

  it("replaces prices immediately", () => {
    expect(els[0].textContent).toBe("$10.00");
    expect(els[1].textContent).toBe("$20.50");
  });

  it("updates prices when currency changes", () => {
    setSelectedCurrency("EUR");
    expect(els[0].textContent).toBe("€5.00");
    expect(els[1].textContent).toBe("€10.25");
  });

  it("does not compound on repeated currency changes", () => {
    setSelectedCurrency("EUR");
    setSelectedCurrency("USD");
    expect(els[0].textContent).toBe("$10.00");
    expect(els[1].textContent).toBe("$20.50");
  });
});
