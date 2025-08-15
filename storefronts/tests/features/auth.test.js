import { describe, it, beforeEach, expect, vi } from 'vitest';

let fromMock;
let supabaseMock;
let client;

describe('auth feature init', () => {
  beforeEach(async () => {
    vi.resetModules();
    fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              store_id: '1',
              active_payment_gateway: null,
              publishable_key: 'pk',
              base_currency: 'USD'
            }
          })
        }))
      }))
    }));
    supabaseMock = {
      from: fromMock,
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: {} } }),
        getSessionFromUrl: vi.fn().mockResolvedValue({}),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } }
        }))
      }
    };
    globalThis.xc = supabaseMock;
    vi.doMock('../../../supabase/browserClient.js', () => ({
      supabase: supabaseMock,
      ensureSupabaseSessionAuth: vi.fn().mockResolvedValue()
    }));
    vi.doMock('../../features/currency/index.js', () => ({
      setBaseCurrency: vi.fn(),
      updateRates: vi.fn(),
      init: vi.fn()
    }));
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    global.window = {
      location: { hash: '', search: '' },
      Smoothr: {},
      smoothr: {}
    };
    global.document = {
      readyState: 'complete',
      addEventListener: vi.fn(),
      currentScript: { getAttribute: vi.fn(), dataset: {} },
      querySelectorAll: vi.fn(() => [])
    };
    const mod = await import('../../features/auth/init.js');
    client = await mod.__test_tryImportClient();
    mod.__test_resetAuth();
  });

  it('loads v_public_store during init', async () => {
    const { init } = await import('../../features/auth/init.js');
    const api = await init({ storeId: '1', supabase: client });
    expect(api).toHaveProperty('login');
    expect(fromMock).toHaveBeenCalledWith('v_public_store');
  });
});

