// Tests for script element and storeId validation
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../features/auth/init.js', () => ({ init: vi.fn() }));
vi.mock('../../features/currency/index.js', () => ({ init: vi.fn() }));

describe('Smoothr SDK script element validation', () => {
  let warnSpy;
  beforeEach(() => {
    vi.resetModules();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.location = { search: '?smoothr-debug=true' };
    global.window = { location: { search: '?smoothr-debug=true' } };
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns and aborts when script element is missing', async () => {
    global.document = { getElementById: vi.fn(() => null) };

    await import('../../smoothr-sdk.js');

    expect(warnSpy).toHaveBeenCalled();
    expect(global.window.Smoothr).toBeUndefined();
  });

  it('warns and aborts when data-store-id is missing', async () => {
    const el = { dataset: {}, getAttribute: vi.fn() };
    global.document = { getElementById: vi.fn(() => el) };

    await import('../../smoothr-sdk.js');

    expect(warnSpy).toHaveBeenCalled();
    expect(global.window.Smoothr).toBeUndefined();
  });
});
