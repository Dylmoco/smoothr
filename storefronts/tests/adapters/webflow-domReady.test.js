import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initAdapter } from 'storefronts/adapters/webflow.js';
import * as currencyAdapter from 'storefronts/adapters/webflow/currencyDomAdapter.js';

const initCurrencyDom = vi
  .spyOn(currencyAdapter, 'initCurrencyDom')
  .mockImplementation(() => {});

describe('webflow adapter domReady', () => {
  let realDocument;
  let realConfig;

  beforeEach(() => {
    vi.useFakeTimers();
    realConfig = globalThis.SMOOTHR_CONFIG;
    globalThis.SMOOTHR_CONFIG = {};
    realDocument = global.document;
    global.document = {
      readyState: 'loading',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.document = realDocument;
    if (realConfig === undefined) {
      delete globalThis.SMOOTHR_CONFIG;
    } else {
      globalThis.SMOOTHR_CONFIG = realConfig;
    }
  });

  it('resolves when DOMContentLoaded fires', async () => {
    let listener;
    document.addEventListener.mockImplementation((evt, cb) => {
      if (evt === 'DOMContentLoaded') listener = cb;
    });

    const { domReady } = initAdapter({});
    const p = domReady();
    listener && listener();
    await expect(p).resolves.toBeUndefined();
    expect(initCurrencyDom).toHaveBeenCalled();
  });

  it('rejects after timeout when DOMContentLoaded never fires', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.SMOOTHR_CONFIG = { debug: true };

    const { domReady } = initAdapter({});
    const p = domReady();
    const expectation = expect(p).rejects.toThrow('DOM ready timeout');
    await vi.advanceTimersByTimeAsync(5000);
    await expectation;
    expect(warnSpy).toHaveBeenCalledWith('[Smoothr Webflow] DOM ready timeout');
    expect(initCurrencyDom).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
