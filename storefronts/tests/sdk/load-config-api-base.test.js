import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.stubEnv('NODE_ENV', 'production');

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
  const getSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  });
  const ensureSupabaseSessionAuth = vi.fn().mockResolvedValue();
  from = vi.fn();
  const client = {
    auth: { getSession },
    from,
    supabaseUrl: 'https://mock.supabase.co',
  };
  return { supabase: client, default: client, ensureSupabaseSessionAuth };
});

beforeEach(() => {
  vi.resetModules();

  global.window = {
    SMOOTHR_CONFIG: { storeId: '00000000-0000-0000-0000-000000000000' },
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

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ api_base: 'https://example.com' }),
    })
  );

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

describe('loadConfig api_base mapping', () => {
  it('sets apiBase from supabase config', async () => {
    console.log('Starting test: loadConfig api_base mapping');
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

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.window.SMOOTHR_CONFIG.apiBase).toBe('https://example.com');
    expect(from).not.toHaveBeenCalled();
  }, 5000);
});
