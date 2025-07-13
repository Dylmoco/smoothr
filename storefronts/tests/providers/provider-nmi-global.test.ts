import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  delete (window as any).Smoothr;
});

afterEach(() => {
  delete (window as any).Smoothr;
});

describe('nmi gateway global', () => {
  it('exposes mountNMIFields on window', async () => {
    await import('../../checkout/gateways/nmi.js');
    expect(typeof window.Smoothr.mountNMIFields).toBe('function');
  });
});
