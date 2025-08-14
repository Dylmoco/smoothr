import { describe, it, beforeEach, expect, vi } from 'vitest';

let loadPublicConfigMock;
let supabaseMock;

describe('checkout feature init', () => {
  beforeEach(() => {
    vi.resetModules();
    supabaseMock = { from: vi.fn() };
    globalThis.Hc = supabaseMock;
    loadPublicConfigMock = vi.fn().mockResolvedValue({});
    vi.doMock('../../features/config/sdkConfig.js', () => ({
      loadPublicConfig: loadPublicConfigMock
    }));
    let cfg = { storeId: '1', supabase: undefined, settings: {}, debug: false };
    vi.doMock('../../features/config/globalConfig.js', () => ({
      getConfig: vi.fn(() => cfg),
      mergeConfig: vi.fn(obj => Object.assign(cfg, obj))
    }));
    vi.doMock('../../utils/platformReady.js', () => ({ platformReady: vi.fn().mockResolvedValue() }));
    vi.doMock('../../features/checkout/utils/checkoutLogger.js', () => ({
      default: () => ({ log: vi.fn(), warn: vi.fn(), err: vi.fn(), select: vi.fn().mockResolvedValue(), q: vi.fn() })
    }));
    vi.doMock('../../features/checkout/utils/resolveGateway.js', () => ({ default: vi.fn(() => null) }));
    global.window = { Smoothr: {}, smoothr: {} };
    global.document = {};
  });

  it('fetches public config using supplied Supabase client', async () => {
    const { init } = await import('../../features/checkout/init.js');
    await init({ storeId: '1' });
    expect(loadPublicConfigMock).toHaveBeenCalledWith('1', supabaseMock);
  });
});

