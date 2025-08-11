import { describe, it, beforeEach, vi, expect } from 'vitest';
import { LOG } from '../../utils/logger.js';

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

vi.mock('../../../shared/supabase/browserClient.js', () => {
  const client = {
    auth: { getSession: getSessionMock },
    from: vi.fn(),
    supabaseUrl: 'https://mock.supabase.co'
  };
  return {
    default: client,
    getClient: () => client,
    ensureSupabaseSessionAuth: vi.fn().mockResolvedValue()
  };
});

beforeEach(() => {
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
});

describe('auth init session restoration', () => {
  it('restores session only once', async () => {
    const mod = await import('../../features/auth/init.js');
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await mod.init({ storeId: 's1' });
    await mod.init({ storeId: 's1' });
    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.filter((c) => c[0] === LOG.AUTH_SESSION_RESTORED).length).toBe(1);
  });
});

