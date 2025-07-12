import { describe, it, expect, beforeEach, vi } from 'vitest';

let mountNMIFields: any;
let getCredMock: any;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  ['card-number', 'card-expiry', 'card-cvc'].forEach(attr => {
    const div = document.createElement('div');
    div.setAttribute(`data-smoothr-${attr}`, '');
    document.body.appendChild(div);
  });

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
    const num = document.querySelector('[data-smoothr-card-number]');
    expect(num?.getAttribute('data-tokenization-key')).toBe('tok_key');
  });
});
