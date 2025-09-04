import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { __test_bootstrap } from 'storefronts/smoothr-sdk.mjs';

const checkoutInitMock = vi.fn();
vi.mock('storefronts/features/checkout/init.js', () => ({
  default: checkoutInitMock,
  init: checkoutInitMock,
}));

beforeEach(() => {
  document.body.innerHTML = `<button data-smoothr="pay"></button>`;
  checkoutInitMock.mockClear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('initializes checkout when trigger exists', async () => {
  await __test_bootstrap({
    storeId: 'test-store',
    supabaseUrl: 'x',
    supabaseAnonKey: 'y',
    activePaymentGateway: 'stripe',
  });
  expect(checkoutInitMock).toHaveBeenCalled();
});
