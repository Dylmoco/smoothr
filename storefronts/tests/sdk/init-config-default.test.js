import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../core/auth/index.js', () => ({ initAuth: vi.fn(), user: null }));

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
  );
  global.window = {
    location: { origin: '', href: '', hostname: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
  };
  Object.defineProperty(global.document, 'currentScript', {
    value: { dataset: {} },
    writable: true,
    configurable: true,
  });
  delete global.window.SMOOTHR_CONFIG;
});

afterEach(() => {
  Object.defineProperty(global.document, 'currentScript', {
    value: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } },
    writable: true,
    configurable: true,
  });
  delete global.window.SMOOTHR_CONFIG;
});

describe('initSmoothr with missing storeId', () => {
  it('creates an empty SMOOTHR_CONFIG object', async () => {
    await import('../../core/index.js');
    expect(global.window.SMOOTHR_CONFIG).toEqual({});
  });
});
