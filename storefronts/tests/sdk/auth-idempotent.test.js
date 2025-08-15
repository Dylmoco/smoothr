import { describe, it, beforeEach, vi, expect } from 'vitest';

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

vi.mock('../../features/config/sdkConfig.js', () => ({
  loadPublicConfig: vi.fn().mockResolvedValue({}),
}));

const getSessionMock = vi.fn().mockResolvedValue({
  data: { session: {} },
});

let client;

vi.mock('../../../supabase/browserClient.js', () => ({
  supabase: {
    auth: { getSession: getSessionMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) })) })),
    })),
    supabaseUrl: process.env.SUPABASE_URL,
  },
  ensureSupabaseSessionAuth: vi.fn().mockResolvedValue(),
}));

beforeEach(async () => {
  vi.resetModules();
  process.env.NODE_ENV = 'production';
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
  global.window = {
    location: { origin: '', href: '', hostname: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  global.document = {
    addEventListener: vi.fn((evt, cb) => {
      if (evt === 'DOMContentLoaded') cb();
    }),
    querySelectorAll: vi.fn(() => []),
    dispatchEvent: vi.fn(),
    currentScript: { getAttribute: vi.fn(), dataset: { storeId: 's1' } },
  };
  globalThis.xc = {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }))
      }))
    }))
  };
  const mod = await import('../../features/auth/init.js');
  client = await mod.__test_tryImportClient();
  mod.__test_resetAuth();
});

describe('auth init session restoration', () => {
  it('restores session only once', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mod = await import('../../features/auth/init.js');
    await mod.init({ storeId: 's1', supabase: client });
    await mod.init({ storeId: 's1', supabase: client });
    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.filter((c) => c[0] === '[Smoothr] Auth restored').length).toBe(1);
  });
});

