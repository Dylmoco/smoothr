import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../shared/supabase/serverClient', () => {

  const single = vi.fn(async () => ({ data: { foo: 'bar' }, error: null }));
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { supabase: { from } };
});

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
  );
  global.window = {
    location: { origin: '', href: '', hostname: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    SMOOTHR_CONFIG: { apiBase: 'https://example.com' }
  };
  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null)
  };
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };
});

describe('loadConfig merge', () => {
  it('preserves existing config values', async () => {
    await import('../../core/index.js');
    expect(global.window.SMOOTHR_CONFIG).toEqual(
      expect.objectContaining({
        apiBase: 'https://example.com',
        foo: 'bar',
        storeId: '00000000-0000-0000-0000-000000000000'
      })
    );
  });
});
