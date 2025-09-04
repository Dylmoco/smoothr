import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../adapters/webflow/currencyDomAdapter.js', () => ({
  initCurrencyDom: vi.fn(),
}));

import { initAdapter } from '../../adapters/webflow.js';

class MockElement {
  constructor(legacyAttr) {
    this.attributes = { [legacyAttr]: '' };
    this.legacyAttr = legacyAttr;
    this.nodeType = 1;
  }
  getAttribute(attr) {
    return this.attributes[attr];
  }
  setAttribute(attr, val) {
    this.attributes[attr] = String(val);
  }
  hasAttribute(attr) {
    return attr in this.attributes;
  }
  querySelectorAll(sel) {
    return sel === `[${this.legacyAttr}]` ? [this] : [];
  }
}

describe('webflow adapter dynamic legacy normalization', () => {
  let observer;

  beforeEach(() => {
    global.document = {
      readyState: 'complete',
      body: {},
      querySelectorAll: vi.fn(() => []),
    };

    global.MutationObserver = class {
      constructor(cb) {
        this.cb = cb;
        observer = this;
      }
      observe() {}
      disconnect() {}
      trigger(mutations) {
        this.cb(mutations, this);
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete global.document;
    delete global.MutationObserver;
    observer = undefined;
  });

  it('normalizes late-inserted legacy attributes', () => {
    const { observeDOMChanges } = initAdapter({});
    observeDOMChanges();

    const el = new MockElement('data-smoothr-pay');

    observer.trigger([{ addedNodes: [el] }]);

    expect(el.attributes['data-smoothr']).toBe('pay');
  });
});
