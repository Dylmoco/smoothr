import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDomStub } from "../utils/dom-stub";
import {
  setSelectedCurrency,
  initCurrencyDom,
} from "../../adapters/webflow/currencyDomAdapter.js";
import * as currency from "../../features/currency/index.js";

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

    let realDocument;
    beforeEach(async () => {
    await currency.init({ baseCurrency: "USD" });
    currency.updateRates({ USD: 1, EUR: 0.5 });

    store = null;
    global.localStorage = {
      getItem: vi.fn(() => store),
      setItem: vi.fn((k, v) => {
        store = v;
      }),
    };
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
    );

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
      {
        attributes: { "data-product-price": "5" },
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

      realDocument = global.document;
      global.document = createDomStub({
        addEventListener: vi.fn((evt, cb) => {
          events[evt] = cb;
        }),
        querySelectorAll: vi.fn(() => els),
        dispatchEvent: vi.fn((ev) => {
          events[ev.type]?.(ev);
        }),
      });
    global.window = {
      location: { origin: "", href: "", hostname: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.CustomEvent = CustomEvt;

    initCurrencyDom();
    });

    afterEach(() => {
      global.document = realDocument;
    });

  it("replaces prices immediately", () => {
    expect(els[0].textContent).toBe("$10.00");
    expect(els[1].textContent).toBe("$20.50");
    expect(els[2].textContent).toBe("$5.00");
  });

  it("updates prices when currency changes", () => {
    setSelectedCurrency("EUR");
    expect(els[0].textContent).toBe("€5.00");
    expect(els[1].textContent).toBe("€10.25");
    expect(els[2].textContent).toBe("€2.50");
  });

  it("does not compound on repeated currency changes", () => {
    setSelectedCurrency("EUR");
    setSelectedCurrency("USD");
    expect(els[0].textContent).toBe("$10.00");
    expect(els[1].textContent).toBe("$20.50");
    expect(els[2].textContent).toBe("$5.00");
  });
});
