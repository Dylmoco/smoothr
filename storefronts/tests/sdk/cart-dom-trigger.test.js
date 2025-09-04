import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { __test_bootstrap } from 'storefronts/smoothr-sdk.mjs';

const cartInitMock = vi.fn();
vi.mock('storefronts/features/cart/init.js', () => ({
  default: cartInitMock,
  init: cartInitMock,
}));

beforeEach(() => {
  document.body.innerHTML = `
    <button data-smoothr="add-to-cart" data-product-id="p_1"></button>
  `;
  cartInitMock.mockClear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('imports cart when [data-smoothr="add-to-cart"] is present', async () => {
  await __test_bootstrap({
    storeId: 'test-store',
    supabaseUrl: 'x',
    supabaseAnonKey: 'y',
    activePaymentGateway: 'stripe',
  });
  expect(cartInitMock).toHaveBeenCalled();
});
