import { describe, it, expect, beforeEach, vi } from 'vitest';

let mountNMIFields: any;
let fromMock: any;
let eqMock: any;
let containsMock: any;
let maybeSingleMock: any;
let selectMock: any;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  ['card-number', 'card-expiry', 'card-cvc'].forEach(attr => {
    const div = document.createElement('div');
    div.setAttribute(`data-smoothr-${attr}`, '');
    document.body.appendChild(div);
  });

  maybeSingleMock = vi.fn(async () => ({ data: { settings: { tokenization_key: 'tok_key' } }, error: null }));
  containsMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
  eqMock = vi.fn(() => ({ contains: containsMock }));
  selectMock = vi.fn(() => ({ eq: eqMock }));
  fromMock = vi.fn(() => ({ select: selectMock }));

  vi.mock('../../../supabase/supabaseClient.js', () => ({
    default: { from: fromMock }
  }));

  window.SMOOTHR_CONFIG = { storeId: 'store-1', active_payment_gateway: 'nmi' } as any;

  const mod = await import('../../checkout/gateways/nmi.js');
  mountNMIFields = mod.mountNMIFields;
});

describe('mountNMIFields', () => {
  it('loads tokenization key from supabase and applies it', async () => {
    await mountNMIFields();
    expect(fromMock).toHaveBeenCalledWith('store_integrations');
    expect(eqMock).toHaveBeenCalledWith('store_id', 'store-1');
    expect(containsMock).toHaveBeenCalledWith('settings', { gateway: 'nmi' });
    const num = document.querySelector('[data-smoothr-card-number]');
    expect(num?.getAttribute('data-tokenization-key')).toBe('tok_key');
  });
});
