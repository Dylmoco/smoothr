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
    const createSpy = vi.spyOn(document, 'createElement');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const promise1 = loadScriptOnce(srcError);
    const script1 = document.querySelector(`script[src="${srcError}"]`);
    script1.dispatchEvent(new Event('error'));
    await expect(promise1).rejects.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(`[Smoothr] Failed to load ${srcError}`);

    script1.remove();

    const promise2 = loadScriptOnce(srcError);
    const script2 = document.querySelector(`script[src="${srcError}"]`);
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(script2).not.toBe(script1);
    script2.dispatchEvent(new Event('load'));
    await expect(promise2).resolves.toBeUndefined();
  });

  it('retries after timeout', async () => {
    vi.useFakeTimers();
    const createSpy = vi.spyOn(document, 'createElement');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const promise1 = loadScriptOnce(srcTimeout, { timeout: 50 });
    vi.advanceTimersByTime(51);
    await expect(promise1).rejects.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(`[Smoothr] Script load timed out ${srcTimeout}`);

    const script1 = document.querySelector(`script[src="${srcTimeout}"]`);
    script1.remove();

    const promise2 = loadScriptOnce(srcTimeout, { timeout: 50 });
    const script2 = document.querySelector(`script[src="${srcTimeout}"]`);
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(script2).not.toBe(script1);
    script2.dispatchEvent(new Event('load'));
    await expect(promise2).resolves.toBeUndefined();
  });
});
