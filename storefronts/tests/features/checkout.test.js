import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

let loadPublicConfigMock;
let supabaseMock;

  describe('checkout feature init', () => {
    let realDocument;
    beforeEach(() => {
      vi.resetModules();
      supabaseMock = { from: vi.fn() };
      globalThis.Zc = supabaseMock;
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
      realDocument = global.document;
      global.document = {};
    });

    afterEach(() => {
      global.document = realDocument;
    });

  it('fetches public config using supplied Supabase client', async () => {
    const { init } = await import('../../features/checkout/init.js');
    await init({ storeId: '1' });
    // The SDK now passes a full client; we only care that it supplies `.from`.
    expect(loadPublicConfigMock).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ from: expect.any(Function) })
    );
  });
});

