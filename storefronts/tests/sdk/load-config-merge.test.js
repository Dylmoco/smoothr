import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as core from '../../features/auth/init.js';

vi.mock('../../features/auth/index.js', () => {
  const authMock = {
    initAuth: vi.fn().mockResolvedValue(),
    user: null,
    $$typeof: Symbol.for('react.test.json'),
    type: 'module',
    props: {},
    children: []
  };
  return { default: authMock, ...authMock };
});

vi.mock('../../../supabase/supabaseClient.js', () => {
  const getSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: 'test-token' } }
  });

  const setSession = vi.fn();
  const ensureSupabaseSessionAuth = vi.fn().mockResolvedValue();

  const single = vi.fn(() =>
    Promise.resolve({
      data: { foo: 'bar' },
      error: null
    })
  );
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    supabase: {
      auth: { getSession, setSession },
      from
    },
    ensureSupabaseSessionAuth
  };
});

beforeEach(() => {
  vi.resetModules();

  global.window = {
    SMOOTHR_CONFIG: {
      apiBase: 'https://example.com',
      storeId: '00000000-0000-0000-0000-000000000000'
    },
    location: { origin: '', href: '', hostname: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
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
      )
    })),
    currentScript: {
      dataset: { storeId: '00000000-0000-0000-0000-000000000000' },
      getAttribute: vi.fn((attr) =>
        attr === 'data-store-id'
          ? '00000000-0000-0000-0000-000000000000'
          : null
      )
    }
  };

  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
  );

  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };

  console.log('Test setup: SMOOTHR_CONFIG=', global.window.SMOOTHR_CONFIG);
});

describe('loadConfig merge', () => {
  it('preserves existing config values', async () => {
    console.log('Starting test: loadConfig merge');
    const { loadConfig } = await import(
      '../../features/auth/init.js'
    );
    await loadConfig('00000000-0000-0000-0000-000000000000');

    console.log(
      'SMOOTHR_CONFIG after loadConfig:',
      global.window.SMOOTHR_CONFIG
    );

    expect(global.window.SMOOTHR_CONFIG).toEqual(
      expect.objectContaining({
        apiBase: 'https://example.com',
        foo: 'bar',
        storeId: '00000000-0000-0000-0000-000000000000'
      })
    );
  }, 5000);
});
