// [Codex Fix] Updated for ESM/Vitest/Node 20 compatibility
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../auth/index.js', () => ({ initAuth: vi.fn() }));

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ rates: {} }) })
  );
  global.window = {
    location: { origin: '', href: '', hostname: '' }
  };
});

describe('global smoothr alias', () => {
  it('sets window.smoothr referencing the Smoothr object', async () => {
    const core = await import('../index.js');
    expect(global.window.Smoothr).toBe(core.default);
    expect(global.window.smoothr).toBe(core.default);
    expect(typeof global.window.smoothr.orders.renderOrders).toBe('function');
  });
});
