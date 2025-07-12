import { describe, it, expect, beforeEach, vi } from 'vitest';

let mountNMIFields: any;
let getCredMock: any;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  const wrapper = document.createElement('div');
  ['card-number', 'card-expiry', 'card-cvc', 'postal'].forEach(attr => {
    const div = document.createElement('div');
    div.setAttribute(`data-smoothr-${attr}`, '');
    wrapper.appendChild(div);
  });
  document.body.appendChild(wrapper);

  getCredMock = vi.fn(async () => ({ settings: { tokenization_key: 'tok_key' } }));

  vi.mock('../../checkout/getPublicCredential.js', () => ({
    getPublicCredential: getCredMock
  }));

  window.SMOOTHR_CONFIG = { storeId: 'store-1', active_payment_gateway: 'nmi' } as any;

  const mod = await import('../../checkout/gateways/nmi.js');
  mountNMIFields = mod.mountNMIFields;
});

describe('mountNMIFields', () => {
  it('loads tokenization key and applies it', async () => {
    await mountNMIFields();
    expect(getCredMock).toHaveBeenCalledWith('store-1', 'nmi', 'nmi');
    const wrapper = document.querySelector('[data-smoothr-card-number]')?.parentElement;
    expect(wrapper?.getAttribute('data-tokenization-key')).toBe('tok_key');
  });

  it('injects inputs when missing', async () => {
    await mountNMIFields();
    const num = document.querySelector('[data-smoothr-card-number]');
    const cvc = document.querySelector('[data-smoothr-card-cvc]');
    const postal = document.querySelector('[data-smoothr-postal]');
    const expiry = document.querySelector('[data-smoothr-card-expiry]');
    expect(num?.querySelector('input')?.getAttribute('data-collect')).toBe('cardNumber');
    expect(cvc?.querySelector('input')?.getAttribute('data-collect')).toBe('cvv');
    expect(postal?.querySelector('input')?.getAttribute('data-collect')).toBe('postal');
    expect(expiry?.querySelector('input[data-collect="expMonth"]')).toBeTruthy();
    expect(expiry?.querySelector('input[data-collect="expYear"]')).toBeTruthy();
  });
});
