import { describe, it, expect, beforeEach, vi } from 'vitest';

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

  const setAuth = vi.fn();

  const maybeSingle = vi.fn().mockResolvedValue({
    data: { foo: 'bar' },
    error: null
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    supabase: {
      auth: { getSession, setAuth },
      from
    }
  };
});

beforeEach(() => {
  vi.resetModules();

  global.window = {
    SMOOTHR_CONFIG: { apiBase: 'https://example.com' },
    location: { origin: '', href: '', hostname: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };

  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    currentScript: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } }
  };

  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
  );

  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };
});

describe('loadConfig merge', () => {
  it(
    'preserves existing config values',
    async () => {
      await import('../../core/index.js');

      const timeout = 5000;
      const started = Date.now();

      await new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          const ready = global.window.SMOOTHR_CONFIG.foo === 'bar';
          const expired = Date.now() - started > timeout;

          if (ready) {
            clearInterval(interval);
            resolve();
          } else if (expired) {
            clearInterval(interval);
            reject(new Error('Timed out waiting for SMOOTHR_CONFIG.foo'));
          }
        }, 10);
      });

      expect(global.window.SMOOTHR_CONFIG).toEqual(
        expect.objectContaining({
          apiBase: 'https://example.com',
          foo: 'bar',
          storeId: '00000000-0000-0000-0000-000000000000'
        })
      );
    },
    6000 // timeout override
  );
});
