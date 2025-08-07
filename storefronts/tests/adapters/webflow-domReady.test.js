import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../adapters/webflow/currencyDomAdapter.js', () => ({
  initCurrencyDom: vi.fn(),
}));

import { initAdapter } from '../../adapters/webflow.js';
import { initCurrencyDom } from '../../adapters/webflow/currencyDomAdapter.js';

describe('webflow adapter domReady', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.SMOOTHR_CONFIG = {};
    global.document = {
      readyState: 'loading',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
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
