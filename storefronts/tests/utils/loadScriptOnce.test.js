import { describe, it, expect, vi, afterEach } from 'vitest';
import loadScriptOnce from '../../utils/loadScriptOnce.js';

const srcError = 'https://example.com/error.js';
const srcTimeout = 'https://example.com/timeout.js';

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

    for (let i = 0; i < retries; i++) {
      const script = document.querySelector(`script[src="${srcError}"]`);
      script.dispatchEvent(new Event('error'));
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
    }

    const finalScript = document.querySelector(`script[src="${srcError}"]`);
    finalScript.dispatchEvent(new Event('error'));
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
