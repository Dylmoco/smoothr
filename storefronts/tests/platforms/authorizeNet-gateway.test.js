import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../supabase/supabaseClient.js', () => {
  const maybeSingle = vi.fn(async () => ({
    data: { settings: { client_key: 'client', api_login_id: 'id' } },
    error: null
  }));
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));
  const from = vi.fn(() => ({ select }));
  return { default: { from } };
});

let createPaymentMethod;
let mountCardFields;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  window.SMOOTHR_CONFIG = { storeId: 'store-1', debug: true };

  ['card-number', 'card-expiry', 'card-cvc'].forEach(attr => {
    const div = document.createElement('div');
    div.setAttribute(`data-smoothr-${attr}`, '');
    document.body.appendChild(div);
  });

  const first = document.createElement('input');
  first.setAttribute('data-smoothr-bill-first-name', '');
  first.value = 'Jane';
  document.body.appendChild(first);

  const last = document.createElement('input');
  last.setAttribute('data-smoothr-bill-last-name', '');
  last.value = 'Doe';
  document.body.appendChild(last);

  const mod = await import('../../checkout/gateways/authorizeNet.js');
  createPaymentMethod = mod.createPaymentMethod;
  mountCardFields = mod.mountCardFields;

  await mountCardFields();

  document.querySelector('[data-smoothr-card-number] input').value = '41111111111111111';
  document.querySelector('[data-smoothr-card-expiry] input').value = '12/29';
  document.querySelector('[data-smoothr-card-cvc] input').value = '123';
});

describe('authorizeNet createPaymentMethod', () => {
  it('returns opaqueData on successful dispatch', async () => {
    const dataDescriptor = 'desc';
    const dataValue = 'val';
    window.Accept.dispatchData = vi.fn((sd, cb) => {
      cb({ opaqueData: { dataDescriptor, dataValue }, messages: { resultCode: 'Ok' } });
    });

    const res = await createPaymentMethod();

    expect(res).toEqual({ error: null, payment_method: { dataDescriptor, dataValue } });
  });
});
