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
    querySelectorAll: vi.fn(() => []),
    body: {},
    dispatchEvent: vi.fn(),
  };
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
