import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import loadScriptOnce from '../../utils/loadScriptOnce.js';

const srcError = 'https://example.com/error.js';
const srcTimeout = 'https://example.com/timeout.js';
const srcLoaded = 'https://example.com/loaded.js';

describe('loadScriptOnce retry behavior', () => {
  afterEach(() => {
    document.querySelectorAll(`script[src="${srcError}"], script[src="${srcTimeout}"]`).forEach(s => s.remove());
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retries after error', async () => {
    vi.useFakeTimers();
    const retries = 2;
    const createSpy = vi.spyOn(document, 'createElement');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const promise = loadScriptOnce(srcError, { timeout: 1, retries, retryDelay: 1 });
    const expectPromise = expect(promise).rejects.toThrow();
    await Promise.resolve();

    for (let i = 0; i < retries; i++) {
      const script = document.querySelector(`script[src="${srcError}"]`);
      script && script.dispatchEvent(new Event('error'));
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
    }

    await vi.runAllTimersAsync();
    await expectPromise;

    const retryWarnings = warnSpy.mock.calls.filter(([msg]) => msg.startsWith('[Smoothr] Retry loading'));
    const expectedRetryMessages = Array.from({ length: retries }, (_, i) => [`[Smoothr] Retry loading ${srcError} (${i + 1}/${retries + 1})`]);
    expect(retryWarnings).toEqual(expectedRetryMessages);
    expect(warnSpy).toHaveBeenLastCalledWith(`[Smoothr] Failed to load ${srcError}`);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledTimes(retries + 1);
  }, 20000);

  it('retries after timeout', async () => {
    vi.useFakeTimers();
    const retries = 2;
    const createSpy = vi.spyOn(document, 'createElement');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const promise = loadScriptOnce(srcTimeout, { timeout: 1, retries, retryDelay: 1 });
    const expectPromise = expect(promise).rejects.toThrow();

    for (let i = 0; i < retries; i++) {
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
    }

    vi.advanceTimersByTime(1);
    await vi.runAllTimersAsync();
    await expectPromise;

    const retryWarnings = warnSpy.mock.calls.filter(([msg]) => msg.startsWith('[Smoothr] Retry loading'));
    const expectedRetryMessages = Array.from({ length: retries }, (_, i) => [`[Smoothr] Retry loading ${srcTimeout} (${i + 1}/${retries + 1})`]);
    expect(retryWarnings).toEqual(expectedRetryMessages);
    expect(warnSpy).toHaveBeenLastCalledWith(`[Smoothr] Failed to load ${srcTimeout}`);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledTimes(retries + 1);
  }, 20000);
});

describe('loadScriptOnce existing script handling', () => {
  beforeEach(() => {
    window.SMOOTHR_CONFIG = { debug: true };
  });

  afterEach(() => {
    document.querySelectorAll(`script[src="${srcLoaded}"]`).forEach(s => s.remove());
    delete window.Foo;
  });

  it('skips reloading when script tag already loaded', async () => {
    const script = document.createElement('script');
    script.src = srcLoaded;
    script.setAttribute('data-loaded', 'true');
    document.head.appendChild(script);
    const initial = document.querySelectorAll(`script[src="${srcLoaded}"]`).length;

    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    await loadScriptOnce(srcLoaded);

    const final = document.querySelectorAll(`script[src="${srcLoaded}"]`).length;
    expect(final).toBe(initial);
    expect(debugSpy).toHaveBeenCalled();

    debugSpy.mockRestore();
  });

  it('skips loading when global variable exists', async () => {
    window.Foo = {};
    const createSpy = vi.spyOn(document, 'createElement');
    await loadScriptOnce(srcLoaded, { globalVar: 'Foo' });
    expect(createSpy).not.toHaveBeenCalledWith('script');
    createSpy.mockRestore();
  });
});
