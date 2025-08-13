import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../features/auth/index.js', () => {
  const authMock = {
    initAuth: vi.fn().mockResolvedValue(),
    user: null,
    $$typeof: Symbol.for('react.test.json'),
    type: 'module',
    props: {},
    children: [],
    lookupRedirectUrl: vi.fn(),
    lookupDashboardHomeUrl: vi.fn(),
  };
  return { default: authMock, ...authMock };
});

let from;
vi.mock('../../../supabase/browserClient.js', () => {
  const ensureSupabaseSessionAuth = vi.fn().mockResolvedValue();
  const maybeSingle = vi.fn(async () => ({
    data: { api_base: 'https://example.com', foo: 'bar' },
    error: null,
  }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  from = vi.fn(() => ({ select }));
  const client = { from };
  return { supabase: client, default: client, ensureSupabaseSessionAuth };
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');

  global.window = {
    SMOOTHR_CONFIG: {
      apiBase: 'https://example.com',
      storeId: '00000000-0000-0000-0000-000000000000',
    },
    location: { origin: '', href: '', hostname: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    getElementById: vi.fn(() => ({
      dataset: { storeId: '00000000-0000-0000-0000-000000000000' },
      getAttribute: vi.fn((attr) =>
        attr === 'data-store-id'
          ? '00000000-0000-0000-0000-000000000000'
          : null
      ),
    })),
    currentScript: {
      dataset: { storeId: '00000000-0000-0000-0000-000000000000' },
      getAttribute: vi.fn((attr) =>
        attr === 'data-store-id'
          ? '00000000-0000-0000-0000-000000000000'
          : null
      ),
    },
  };

  global.fetch = vi.fn();

  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };

  console.log('Test setup: SMOOTHR_CONFIG=', global.window.SMOOTHR_CONFIG);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('loadConfig merge', () => {
  it('preserves existing config values', async () => {
    console.log('Starting test: loadConfig merge');
    const { loadPublicConfig } = await import(
      '../../features/config/sdkConfig.js'
    );
    const { mergeConfig } = await import(
      '../../features/config/globalConfig.js'
    );
    const data = await loadPublicConfig(
      '00000000-0000-0000-0000-000000000000'
    );
    const updates = {};
    for (const [key, value] of Object.entries(data || {})) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      updates[camelKey] = value;
    }
    updates.storeId = '00000000-0000-0000-0000-000000000000';
    mergeConfig(updates);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(global.window.SMOOTHR_CONFIG).toEqual(
      expect.objectContaining({
        apiBase: 'https://example.com',
        foo: 'bar',
        storeId: '00000000-0000-0000-0000-000000000000',
      })
    );
    expect(from).toHaveBeenCalledTimes(1);
  }, 5000);
});
