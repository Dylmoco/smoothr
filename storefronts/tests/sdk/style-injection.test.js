import { describe, it, expect, beforeEach, vi } from 'vitest';

let appendSpy;

beforeEach(() => {
  vi.resetModules();
  appendSpy = vi.fn();
  global.document = {
    createElement: vi.fn(() => ({})),
    querySelector: vi.fn(() => null),
    head: { appendChild: appendSpy }
  };
  global.window = { SMOOTHR_CONFIG: { basicStripeStyle: true } };
});

describe('card style injection', () => {
  it('skips style element when basicStripeStyle is true', async () => {
    await import('../../checkout/checkout.js');
    expect(appendSpy).not.toHaveBeenCalled();
  });
});
