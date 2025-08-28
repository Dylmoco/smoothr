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
        getSupabaseClient: () => Promise.resolve(supabaseMock),
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
      smoothr: {},
      SMOOTHR_DEBUG: true
    };
    global.document = {
      readyState: 'complete',
      addEventListener: vi.fn(),
      currentScript: { getAttribute: vi.fn(), dataset: {} },
      querySelectorAll: vi.fn(() => [])
    };
    const mod = await import('../../features/auth/init.js');
    const test = global.window.Smoothr.config.__test;
    client = await test.tryImportClient();
    test.resetAuth();
  });

  it('loads v_public_store during init', async () => {
    const { init } = await import('../../features/auth/init.js');
    const api = await init({ storeId: '1', supabase: client });
    expect(api).toHaveProperty('login');
    expect(fromMock).toHaveBeenCalledWith('v_public_store');
  });

  it('binds document click handler in capture only', async () => {
    const { init } = await import('../../features/auth/init.js');
    await init({ storeId: '1', supabase: client });
    const clickCalls = document.addEventListener.mock.calls.filter(c => c[0] === 'click');
    expect(clickCalls.length).toBe(2);
    const captureCall = clickCalls.find(c => typeof c[2] === 'object');
    expect(captureCall?.[2]).toMatchObject({ capture: true, passive: false });
    const bubbleCall = clickCalls.find(c => c[2] === false);
    expect(bubbleCall).toBeTruthy();
  });
});

