import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithGoogle;

describe('signInWithGoogle', () => {
  beforeEach(async () => {
    vi.resetModules();
    globalThis.ensureConfigLoaded = vi.fn().mockResolvedValue();
    globalThis.getCachedBrokerBase = vi.fn().mockReturnValue('https://smoothr.vercel.app');
    global.window = {
      location: { origin: 'https://store.example', replace: vi.fn() },
      document: { getElementById: vi.fn(() => ({ dataset: { storeId: 'store_test' } })) },
      SMOOTHR_CONFIG: { store_id: 'store_test' }
    };
    ({ signInWithGoogle } = await import('../../features/auth/init.js'));
  });

  it('navigates to broker oauth-start with store and origin', async () => {
    await signInWithGoogle();
    expect(global.window.location.replace).toHaveBeenCalledWith(
      'https://smoothr.vercel.app/api/auth/oauth-start?provider=google&store_id=store_test&orig=https%3A%2F%2Fstore.example'
    );
  });
});
