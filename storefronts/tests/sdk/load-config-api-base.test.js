import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as core from '../../core/index.js';

vi.mock('../../core/auth/index.js', () => {
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

vi.mock('../../../shared/supabase/browserClient', () => {
  const getSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: 'test-token' } }
  });

  const setSession = vi.fn();
  const applySessionAuth = vi.fn().mockResolvedValue();

  const single = vi.fn(() =>
    Promise.resolve({
      data: { api_base: 'https://example.com' },
      error: null
    })
  );
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    supabase: {
      auth: { getSession, setSession },
      applySessionAuth,
      from
    }
  };
});

beforeEach(() => {
  vi.resetModules();

  global.window = {
    SMOOTHR_CONFIG: { storeId: '00000000-0000-0000-0000-000000000000' },
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

describe('loadConfig api_base mapping', () => {
  it('sets apiBase from supabase config', async () => {
    console.log('Starting test: loadConfig api_base mapping');
    const { loadConfig } = await import('../../core/index.js');
    await loadConfig('00000000-0000-0000-0000-000000000000');

    console.log(
      'SMOOTHR_CONFIG after loadConfig:',
      global.window.SMOOTHR_CONFIG
    );

    expect(global.window.SMOOTHR_CONFIG.apiBase).toBe('https://example.com');
  }, 5000);
});
