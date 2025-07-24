import { vi } from "vitest";
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables for tests
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '.env.test') });

if (typeof globalThis.window === "undefined") {
  globalThis.window = { location: { origin: "", href: "", hostname: "" } };
}
if (typeof globalThis.window.addEventListener === "undefined") {
  globalThis.window.addEventListener = vi.fn();
}
if (typeof globalThis.window.removeEventListener === "undefined") {
  globalThis.window.removeEventListener = vi.fn();
}
if (typeof globalThis.document === "undefined") {
  globalThis.document = {
    addEventListener: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    body: {},
    dispatchEvent: vi.fn(),
  };
}
// Stub the <script> tag dataset so loadConfig gets a storeId in tests
if (typeof document !== 'undefined' && !document.currentScript) {
  Object.defineProperty(document, 'currentScript', {
    value: { dataset: { storeId: '00000000-0000-0000-0000-000000000000' } },
    configurable: true,
    writable: true
  });
}
if (typeof globalThis.window.Smoothr === "undefined") {
  globalThis.window.Smoothr = {};
}
if (typeof globalThis.localStorage === "undefined") {
  let store = {};
  globalThis.localStorage = {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
  };
}
globalThis.MutationObserver = class {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  disconnect() {}
};

if (typeof globalThis.alert === "undefined") {
  globalThis.alert = vi.fn();
}

// Stub storeId for SDK bootstrap during tests
Object.defineProperty(document, 'currentScript', {
  value: {
    dataset: {
      storeId: '00000000-0000-0000-0000-000000000000',
    },
  },
});

// Block all real fetch() calls by default to prevent accidental network hits
global.fetch = async (...args) => {
  throw new Error(`Blocked fetch during test: ${args[0]}`);
};
