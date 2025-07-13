import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let mountNMIFields: any;
let ready: any;
let getCredMock: any;
let appendChildSpy: any;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  const wrapper = document.createElement('div');
  ['card-number', 'card-expiry', 'card-cvc', 'postal'].forEach(attr => {
    const div = document.createElement('div');
    div.setAttribute(`data-smoothr-${attr}`, '');
    if (attr === 'card-expiry') {
      const input = document.createElement('input');
      div.appendChild(input);
    }
    wrapper.appendChild(div);
  });
  document.body.appendChild(wrapper);

  appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(el => {
    if ((el as HTMLElement).tagName === 'SCRIPT') {
      window.CollectJS = { configure: vi.fn(), tokenize: vi.fn() } as any;
      setTimeout(() => el.dispatchEvent(new Event('load')));
      return el;
    }
    return HTMLElement.prototype.appendChild.call(document.head, el);
  });

  getCredMock = vi.fn(async () => ({ settings: { tokenization_key: 'tok_key' } }));

  vi.mock('../../checkout/getPublicCredential.js', () => ({
    getPublicCredential: getCredMock
  }));

  window.SMOOTHR_CONFIG = { storeId: 'store-1', active_payment_gateway: 'nmi' } as any;

  const mod = await import('../../checkout/gateways/nmi.js');
  mountNMIFields = mod.mountNMIFields;
  ready = mod.ready;
});

afterEach(() => {
  appendChildSpy?.mockRestore();
  window.CollectJS = undefined as any;
});

describe('mountNMIFields', () => {
  it('loads tokenization key and applies it', async () => {
    await mountNMIFields();
    expect(getCredMock).toHaveBeenCalledWith('store-1', 'nmi', 'nmi');
    const els = document.querySelectorAll('div[data-tokenization-key]');
    expect(els.length).toBe(3);
    els.forEach(el => {
      expect(el.getAttribute('data-tokenization-key')).toBe('tok_key');
    });
  });

  it('injects other inputs and removes expiry inputs when empty', async () => {
    await mountNMIFields();
    const num = document.querySelector('[data-smoothr-card-number]');
    const cvc = document.querySelector('[data-smoothr-card-cvc]');
    const postal = document.querySelector('[data-smoothr-postal]');
    const expiry = document.querySelector('[data-smoothr-card-expiry]');
    expect(num?.querySelector('input')?.getAttribute('data-collect')).toBe('cardNumber');
    expect(cvc?.querySelector('input')?.getAttribute('data-collect')).toBe('cvv');
    expect(postal?.querySelector('input')?.getAttribute('data-collect')).toBe('postal');
    expect(expiry?.querySelector('input[data-collect="expMonth"]')).toBeNull();
    expect(expiry?.querySelector('input[data-collect="expYear"]')).toBeNull();
  });

  it('does not inject hidden expiry inputs until value is valid', async () => {
    await mountNMIFields();
    const expiry = document.querySelector('[data-smoothr-card-expiry] input');
    const input = expiry;
    if (input) {
      input.value = '1';
      input.dispatchEvent(new Event('keyup'));
    }
    expect(expiry?.querySelector('input[data-collect="expMonth"]')).toBeNull();
    expect(expiry?.querySelector('input[data-collect="expYear"]')).toBeNull();
  });

  it('re-injects expiry inputs when corrected', async () => {
    await mountNMIFields();
    const input = document.querySelector('[data-smoothr-card-expiry] input');
    if (input) {
      input.value = '1';
      input.dispatchEvent(new Event('keyup'));
      input.value = '12/34';
      input.dispatchEvent(new Event('keyup'));
    }
    const month = document.querySelector(
      '[data-smoothr-card-expiry] input[data-collect="expMonth"]'
    );
    const year = document.querySelector(
      '[data-smoothr-card-expiry] input[data-collect="expYear"]'
    );
    expect(month?.value).toBe('12');
    expect(year?.value).toBe('2034');
  });

  it('syncs hidden expiry inputs when value changes', async () => {
    await mountNMIFields();
    const expiry = document.querySelector('[data-smoothr-card-expiry] input');
    expect(expiry).not.toBeNull();
    if (expiry) {
      expiry.value = '08/26';
      expiry.dispatchEvent(new Event('keyup'));
    }
    const month = document.querySelector(
      '[data-smoothr-card-expiry] input[data-collect="expMonth"]'
    );
    const year = document.querySelector(
      '[data-smoothr-card-expiry] input[data-collect="expYear"]'
    );
    expect(month?.value).toBe('08');
    expect(year?.value).toBe('2026');
  });

  it('reports ready when all fields and tokenization key are present', async () => {
    await mountNMIFields();
    const expiry = document.querySelector('[data-smoothr-card-expiry] input');
    if (expiry) {
      expiry.value = '11/30';
      expiry.dispatchEvent(new Event('keyup'));
    }
    expect(ready()).toBe(true);
  });
});
