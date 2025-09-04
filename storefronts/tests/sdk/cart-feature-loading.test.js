import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { __test_bootstrap } from 'storefronts/smoothr-sdk.js';

const cartInitMock = vi.fn();
vi.mock('storefronts/features/cart/init.js', () => ({
  default: cartInitMock,
  init: cartInitMock,
}));

beforeEach(() => {
  cartInitMock.mockClear();
  vi.restoreAllMocks();
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('initializes cart when [data-smoothr-total] exists', async () => {
  document.body.innerHTML = `<div data-smoothr-total></div>`;
  await __test_bootstrap({
    storeId: 'test-store',
    supabaseUrl: 'x',
    supabaseAnonKey: 'y',
    activePaymentGateway: 'stripe',
  });
  expect(cartInitMock).toHaveBeenCalled();
});

test('logs when cart triggers are absent', async () => {
  document.body.innerHTML = '';
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  await __test_bootstrap({
    storeId: 'test-store',
    supabaseUrl: 'x',
    supabaseAnonKey: 'y',
    activePaymentGateway: 'stripe',
  });
  expect(cartInitMock).not.toHaveBeenCalled();
  expect(logSpy.mock.calls).toContainEqual([
    '[Smoothr SDK] No cart triggers found, skipping cart initialization',
  ]);
});
