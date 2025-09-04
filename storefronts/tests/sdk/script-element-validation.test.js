// Tests for script element and storeId validation
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDomStub } from '../utils/dom-stub';

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
      const realDoc = global.document;
      global.document = createDomStub({ getElementById: vi.fn(() => null) });

      await import('../../smoothr-sdk.mjs');

      expect(warnSpy).toHaveBeenCalled();
      expect(global.window.Smoothr?.ready).toBeUndefined();
      global.document = realDoc;
    });

    it('warns and aborts when data-store-id is missing', async () => {
      const el = { dataset: {}, getAttribute: vi.fn() };
      const realDoc = global.document;
      global.document = createDomStub({ getElementById: vi.fn(() => el) });

      await import('../../smoothr-sdk.mjs');

      expect(warnSpy).toHaveBeenCalled();
      expect(global.window.Smoothr?.ready).toBeUndefined();
      global.document = realDoc;
    });
});
