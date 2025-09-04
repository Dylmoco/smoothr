// vitest.setup.ts
import { vi } from 'vitest';

console.log('vitest.setup.ts ran');

// Idempotent global bootstrapping for tests.
// If these shims are applied twice (root + workspace), guard with flags.
if (!(globalThis as any).__smoothrSetupApplied) {
  (globalThis as any).__smoothrSetupApplied = true;

  // Basic browser shims that many tests expect
  globalThis.requestAnimationFrame ||= (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number;
  globalThis.cancelAnimationFrame ||= (id: number) => clearTimeout(id as unknown as any);

  // Ensure minimal browser globals exist for tests
  if (typeof (globalThis as any).window === 'undefined') {
    (globalThis as any).window = {};
  }
  if (typeof (globalThis as any).localStorage === 'undefined') {
    (globalThis as any).localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn()
    } as any;
  }

  // ————————————————————————————————————————————————————————————————
  // JSDOM shims for things Vitest needs
  // ————————————————————————————————————————————————————————————————
  if (typeof window !== 'undefined') {
    // override getComputedStyle so it never hits jsdom’s “not implemented” error
    window.getComputedStyle = function () {
      return { getPropertyValue: () => '' };
    };

    // stub out alert
    window.alert = function () { /* no-op */ };

    // minimal MutationObserver stub
    (window as any).MutationObserver = class {
      constructor(callback: () => void) {}
      observe() {}
      disconnect() {}
    };

    // Minimal document stubs for tests that touch the DOM without jsdom
    const doc: any = (globalThis as any).document || ((globalThis as any).document = {});
    doc.querySelector ||= vi.fn(() => null);
    doc.getElementById ||= vi.fn((id) =>
      id === 'smoothr-sdk'
        ? {
            dataset: { storeId: '00000000-0000-0000-0000-000000000000' },
            getAttribute: vi.fn((name) =>
              name === 'data-store-id'
                ? '00000000-0000-0000-0000-000000000000'
                : null
            ),
          }
        : null
    );
    doc.addEventListener ||= vi.fn();
    doc.removeEventListener ||= vi.fn();
    doc.querySelectorAll ||= vi.fn((selector) =>
      selector === '[data-smoothr="pay"]' ? [{ dataset: {} }] : []
    );
    doc.createElement ||= vi.fn(() => ({ style: {} }));
    try {
      Object.defineProperty(doc, 'currentScript', {
        value: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } },
        configurable: true,
        writable: true,
      });
    } catch {}
  }

  // ————————————————————————————————————————————————————————————————
  // Supabase env defaults
  // ————————————————————————————————————————————————————————————————
  process.env.SUPABASE_URL                 ??= 'http://localhost';
  process.env.SUPABASE_SERVICE_ROLE_KEY    ??= 'service-role-key';
  process.env.SUPABASE_ANON_KEY            ??= 'anon-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL     ??= 'http://localhost';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??= 'anon-key';
  process.env.VITE_SUPABASE_URL            ??= process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY       ??= process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ————————————————————————————————————————————————————————————————
  // Smoothr SDK config + script tag shim
  // ————————————————————————————————————————————————————————————————
  (globalThis as any).SMOOTHR_CONFIG = {
    storeId: '00000000-0000-0000-0000-000000000000',
    debug: true,
    // you can add platform, currency, etc. here if needed
  };

  (globalThis as any).Smoothr = (globalThis as any).Smoothr || {};
  (globalThis as any).Smoothr.config = {
    ...(globalThis as any).Smoothr.config || {},
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    debug: true
  };
  (globalThis as any).window.Smoothr = (globalThis as any).Smoothr;

  // Inject preconnect hints used by tests that expect them (jsdom-only)
  const injectPreconnects = () => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    // accounts + a dummy supabase host (tests stub these)
    const hosts = [
      'https://accounts.google.com',
      'https://dummy-project.supabase.co',
    ];
    for (const href of hosts) {
      const el = link.cloneNode() as HTMLLinkElement;
      el.href = href;
      document.head.appendChild(el);
    }
  };

  // Only run DOM manipulations when a browser-like env exists
  if (typeof document !== 'undefined' && document?.head) {
    // inject the <script data-store-id> before any SDK import
    const s = document.createElement('script');
    s.setAttribute('data-store-id', (globalThis as any).SMOOTHR_CONFIG.storeId);
    document.head.appendChild(s);

    injectPreconnects();
  }
}
