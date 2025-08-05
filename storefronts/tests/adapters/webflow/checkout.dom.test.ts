import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const originalFetch = global.fetch;

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  document.body.innerHTML = `
    <div>
      <div data-smoothr-card-number></div>
      <div data-smoothr-card-expiry></div>
      <div data-smoothr-card-cvc></div>
      <button data-smoothr-pay></button>
    </div>
  `;
  delete (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__;
  (window as any).SMOOTHR_CONFIG = { active_payment_gateway: 'stripe' } as any;
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  (global as any).window.fetch = originalFetch;
  delete (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__;
});

describe('webflow checkout adapter dom', () => {

  it('loads without modifying global flag', async () => {
    await import('../../../adapters/webflow/initCheckoutWebflow.js');
    expect((window as any).__SMOOTHR_CHECKOUT_INITIALIZED__).toBeUndefined();

    vi.resetModules();
    (window as any).__SMOOTHR_CHECKOUT_INITIALIZED__ = true;
    await import('../../../adapters/webflow/initCheckoutWebflow.js');
    expect((window as any).__SMOOTHR_CHECKOUT_INITIALIZED__).toBe(true);
  });

  it('initializes phone and country fields from geo lookup', async () => {
    document.body.innerHTML = `
      <select name="shipping[country]">
        <option value="GB">UK</option>
        <option value="US">US</option>
      </select>
      <select name="billing[country]">
        <option value="GB">UK</option>
        <option value="US">US</option>
      </select>
      <select name="phone[country]">
        <option value="GB|+44">UK</option>
        <option value="US|+1">US</option>
      </select>
      <input name="shipping[phone]" />
    `;

    document.documentElement.lang = '';

    const appendSpy = vi
      .spyOn(document.head, 'appendChild')
      .mockImplementation(el => {
        const tag = (el as HTMLElement).tagName;
        if (tag === 'SCRIPT') {
          setTimeout(() => el.dispatchEvent(new Event('load')));
          return el;
        }
        if (tag === 'LINK') {
          return el;
        }
        return HTMLElement.prototype.appendChild.call(document.head, el);
      });

    const fetchMock = vi.fn(async () => ({ json: async () => ({ country_code: 'US' }) }));
    global.fetch = fetchMock as any;
    (global as any).window.fetch = fetchMock as any;
    (window as any).Choices = vi.fn();
    (window as any).intlTelInput = vi.fn();

    vi.useFakeTimers();
    await import('../../../../client/platforms/webflow/checkoutAdapter.js');
    await vi.runAllTimersAsync();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    expect(fetchMock).toHaveBeenCalled();
    expect((window as any).Choices).toHaveBeenCalledTimes(3);
    expect((window as any).intlTelInput).toHaveBeenCalledWith(
      document.querySelector('input[name="shipping[phone]"]'),
      expect.objectContaining({ initialCountry: 'us' })
    );
    expect(
      document.querySelector('select[name="shipping[country]"]')?.value
    ).toBe('US');
    expect(
      document.querySelector('select[name="billing[country]"]')?.value
    ).toBe('US');
    expect(document.querySelector('select[name="phone[country]"]')?.value).toBe('US|+1');

    appendSpy.mockRestore();
  });
});
