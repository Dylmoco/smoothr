import { describe, it, expect, beforeEach, vi } from 'vitest';

let mountNMIFields: any;
let getCredMock: any;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  const wrapper = document.createElement('div');
  ['card-number', 'card-expiry', 'card-cvc'].forEach(attr => {
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
});
