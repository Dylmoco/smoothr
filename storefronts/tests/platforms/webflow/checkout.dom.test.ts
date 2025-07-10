import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = `
    <div data-smoothr-checkout>
      <div data-smoothr-card-number></div>
      <div data-smoothr-card-expiry></div>
      <div data-smoothr-card-cvc></div>
      <button data-smoothr-submit></button>
    </div>
  `;
  delete (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__;
});

describe('webflow checkout adapter dom', () => {
  it('detects checkout and card field targets', async () => {
    const { waitForCheckoutDom } = await import('../../../platforms/webflow/checkout.js');
    const result = await waitForCheckoutDom(100);
    expect(result?.checkout).toBe(document.querySelector('[data-smoothr-checkout]'));
    expect(result?.cardNumber).toBe(document.querySelector('[data-smoothr-card-number]'));
    expect(document.querySelector('[data-smoothr-card-expiry]')).not.toBeNull();
    expect(document.querySelector('[data-smoothr-card-cvc]')).not.toBeNull();
  });

  it('does not reinitialize when flag is set', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await import('../../../platforms/webflow/checkout.js');
    const count = warnSpy.mock.calls.length;

    vi.resetModules();
    (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__ = true;
    await import('../../../platforms/webflow/checkout.js');
    const newCount = warnSpy.mock.calls.length;
    expect(newCount).toBeGreaterThan(count);
    expect(warnSpy.mock.calls[newCount - 1][0]).toContain('Already initialized');
    warnSpy.mockRestore();
  });
});
