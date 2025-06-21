import { vi } from 'vitest';

if (typeof globalThis.window === 'undefined') {
  globalThis.window = { location: { origin: '', href: '', hostname: '' } };
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    body: {},
    dispatchEvent: vi.fn()
  };
}
if (typeof globalThis.localStorage === 'undefined') {
  let store = {};
  globalThis.localStorage = {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    })
  };
}
if (typeof globalThis.MutationObserver === 'undefined') {
  globalThis.MutationObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {}
    disconnect() {}
  };
}
