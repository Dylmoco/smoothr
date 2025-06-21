// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.window = {
    location: { origin: '', href: '', hostname: '' }
  };
});

describe('global currency helper', () => {
  it('attaches setSelectedCurrency to globalThis', async () => {
    await import('../index.js');
    expect(typeof globalThis.setSelectedCurrency).toBe('function');
  });
});
