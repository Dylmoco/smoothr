import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  delete (window as any).Smoothr;
  Object.defineProperty(document, 'readyState', { configurable: true, value: 'loading' });
  vi.spyOn(document, 'addEventListener').mockImplementation(() => {});
});

afterEach(() => {
  delete (window as any).Smoothr;
  Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' });
  (document.addEventListener as any).mockRestore?.();
});

describe('nmi gateway global', () => {
  it('exposes mountNMI on window as mountNMIFields', async () => {
    const mod = await import('../../features/checkout/gateways/nmi.js');
    expect(typeof mod.mountNMI).toBe('function');
    expect(window.Smoothr.mountNMIFields).toBe(mod.mountNMI);
  });
});
