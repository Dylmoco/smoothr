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
    delete globalThis.__SMOOTHR_TEST_FAST_BOOT;
    global.document = {
      readyState: 'loading',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
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

  it('waits if DOMContentLoaded never fires', async () => {
    const { domReady } = initAdapter({});
    const p = domReady();
    const result = await Promise.race([
      p.then(() => 'resolved'),
      vi.advanceTimersByTimeAsync(5000).then(() => 'timeout'),
    ]);
    expect(result).toBe('timeout');
    expect(initCurrencyDom).not.toHaveBeenCalled();
  });
});
