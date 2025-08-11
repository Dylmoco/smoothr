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
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL ?? '';
const TEST_STORE_ID = process.env.TEST_STORE_ID ?? '';

if (TEST_SUPABASE_URL) {
  process.env.SUPABASE_URL = TEST_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_SUPABASE_URL;
}
if (process.env.TEST_SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
}
if (process.env.TEST_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;
}

// ————————————————————————————————————————————————————————————————
// Smoothr SDK config + script tag shim
// ————————————————————————————————————————————————————————————————
;(globalThis as any).SMOOTHR_CONFIG = {
  storeId: TEST_STORE_ID,
  debug: true,
  // you can add platform, currency, etc. here if needed
};

// inject the <script data-store-id> before any SDK import
const s = document.createElement('script');
if (TEST_STORE_ID) s.setAttribute('data-store-id', TEST_STORE_ID);
document.head.appendChild(s);
