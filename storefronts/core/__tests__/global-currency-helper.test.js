import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.window = {};
});

describe('global currency helper', () => {
  it('attaches setSelectedCurrency to globalThis', async () => {
    await import('../index.js');
    expect(typeof globalThis.setSelectedCurrency).toBe('function');
  });
});
