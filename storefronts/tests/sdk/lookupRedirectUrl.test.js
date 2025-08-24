import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('lookupRedirectUrl login', () => {
  beforeEach(() => {
    vi.resetModules();
    global.SMOOTHR_CONFIG = { storeId: '1' };
    global.window = { location: { origin: 'https://example.com' } };
  });
  afterEach(() => {
    vi.resetModules();
    delete global.SMOOTHR_CONFIG;
    delete global.window;
  });

  it('uses sign_in_redirect_url from config when present', async () => {
    vi.doMock('../../features/config/sdkConfig.js', () => ({
      loadPublicConfig: vi.fn().mockResolvedValue({
        sign_in_redirect_url: '/from-view',
        public_settings: { sign_in_redirect_url: '/from-settings' }
      })
    }));
    const { lookupRedirectUrl } = await import('../../../supabase/authHelpers.js');
    const url = await lookupRedirectUrl('login');
    expect(url).toBe('/from-view');
  });

  it('falls back to public_settings when view column missing', async () => {
    vi.doMock('../../features/config/sdkConfig.js', () => ({
      loadPublicConfig: vi.fn().mockResolvedValue({
        sign_in_redirect_url: null,
        public_settings: { sign_in_redirect_url: '/from-settings' }
      })
    }));
    const { lookupRedirectUrl } = await import('../../../supabase/authHelpers.js');
    const url = await lookupRedirectUrl('login');
    expect(url).toBe('/from-settings');
  });

  it('returns null when config missing', async () => {
    vi.doMock('../../features/config/sdkConfig.js', () => ({
      loadPublicConfig: vi.fn().mockResolvedValue({
        sign_in_redirect_url: null,
        public_settings: {}
      })
    }));
    const { lookupRedirectUrl } = await import('../../../supabase/authHelpers.js');
    const url = await lookupRedirectUrl('login');
    expect(url).toBeNull();
  });
});
