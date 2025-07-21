import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../shared/supabase/serverClient', () => {

  const single = vi.fn(async () => ({ data: { api_base: 'https://example.com' }, error: null }));
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
    removeEventListener: vi.fn()
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

describe('loadConfig api_base mapping', () => {
  it('sets apiBase from supabase config', async () => {
    await import('../../core/index.js');
    expect(global.window.SMOOTHR_CONFIG.apiBase).toBe('https://example.com');
  });
});
