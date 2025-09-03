import { describe, it, expect, vi, beforeEach } from 'vitest';

let signInWithGoogle;
let injectAuthPreconnects;

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
    ({ injectAuthPreconnects } = await import('../../smoothr-sdk.js'));
  });

  it('navigates to broker oauth-start with store and origin', async () => {
    await signInWithGoogle();
    expect(global.window.location.replace).toHaveBeenCalledWith(
      'https://smoothr.vercel.app/api/auth/oauth-start?provider=google&store_id=store_test&orig=https%3A%2F%2Fstore.example'
    );
  });

  it('injects preconnect links for auth endpoints', () => {
    document.head.innerHTML = '';
    window.SMOOTHR_CONFIG.supabase_url = 'https://foo.supabase.co';
    injectAuthPreconnects(window.SMOOTHR_CONFIG);
    const pre = document.head.querySelectorAll('link[rel="preconnect"]');
    const dns = document.head.querySelectorAll('link[rel="dns-prefetch"]');
    const hrefs = Array.from(document.head.querySelectorAll('link')).map(l => l.getAttribute('href'));
    expect(pre.length).toBe(2);
    expect(dns.length).toBe(2);
    expect(hrefs).toContain('https://accounts.google.com');
    expect(hrefs).toContain('https://foo.supabase.co');
  });
});
