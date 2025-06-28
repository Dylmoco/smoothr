import { describe, it, expect, beforeEach, vi } from "vitest";
import { setSelectedCurrency, initCurrencyDom } from "../webflow-dom.js";
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
      { getAttribute: vi.fn(() => "10"), textContent: "" },
      { getAttribute: vi.fn(() => "20.5"), textContent: "" },
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
});
