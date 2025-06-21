// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.window = {
    location: { origin: '', href: '', hostname: '' }
  };
  global.document = {
    addEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => [])
  };
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };
});

describe('global currency helper', () => {
  it('attaches setSelectedCurrency to globalThis', async () => {
    await import('../index.js');
    expect(typeof globalThis.setSelectedCurrency).toBe('function');
  });
});
