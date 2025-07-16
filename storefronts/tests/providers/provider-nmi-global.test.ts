import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  delete (window as any).Smoothr;
});

afterEach(() => {
  delete (window as any).Smoothr;
});

describe('nmi gateway global', () => {
  it('exposes mountNMI on window as mountNMIFields', async () => {
    const mod = await import('../../checkout/gateways/nmi.js');
    expect(typeof mod.mountNMI).toBe('function');
    expect(window.Smoothr.mountNMIFields).toBe(mod.mountNMI);
  });
});
