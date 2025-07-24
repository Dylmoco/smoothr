// vitest.setup.ts

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
  ;(window as any).MutationObserver = class {
    constructor(callback: () => void) {}
    observe() {}
    disconnect() {}
  };
}

// ————————————————————————————————————————————————————————————————
// Supabase env defaults
// ————————————————————————————————————————————————————————————————
process.env.SUPABASE_URL                     ??= 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY         ??= 'service-role-key';
process.env.NEXT_PUBLIC_SUPABASE_URL          ??= 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY     ??= 'anon-key';

// ————————————————————————————————————————————————————————————————
// Smoothr SDK config + script tag shim
// ————————————————————————————————————————————————————————————————
;(globalThis as any).SMOOTHR_CONFIG = {
  storeId: '00000000-0000-0000-0000-000000000000',
  debug: true,
  // you can add platform, currency, etc. here if needed
};

// inject the <script data-store-id> before any SDK import
const s = document.createElement('script');
s.setAttribute('data-store-id', (globalThis as any).SMOOTHR_CONFIG.storeId);
document.head.appendChild(s);
