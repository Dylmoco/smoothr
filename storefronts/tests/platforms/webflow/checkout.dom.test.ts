import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = `
    <div>
      <div data-smoothr-card-number></div>
      <div data-smoothr-card-expiry></div>
      <div data-smoothr-card-cvc></div>
      <button data-smoothr-checkout></button>
    </div>
  `;
  delete (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__;
});

describe('webflow checkout adapter dom', () => {

  it('does not reinitialize when flag is set', async () => {
    await import('../../../platforms/webflow/checkout.js');
    expect((window as any).__SMOOTHR_CHECKOUT_INITIALIZED__).toBe(true);

    vi.resetModules();
    (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__ = true;
    await import('../../../platforms/webflow/checkout.js');
    expect((window as any).__SMOOTHR_CHECKOUT_INITIALIZED__).toBe(true);
  });
});
