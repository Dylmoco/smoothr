import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { __test_bootstrap } from 'storefronts/smoothr-sdk.js';

const authInitMock = vi.fn();
vi.mock('storefronts/features/auth/init.js', () => ({
  default: authInitMock,
  init: authInitMock,
}));

beforeEach(() => {
  authInitMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('loads auth feature when auth trigger is present', async () => {
  const authEl = document.createElement('div');
  authEl.setAttribute('data-smoothr', 'auth');

  vi.spyOn(document, 'querySelector')
    .mockReturnValueOnce(authEl)
    .mockReturnValue(null);

  await __test_bootstrap({
    storeId: 'test-store',
    supabaseUrl: 'x',
    supabaseAnonKey: 'y',
    activePaymentGateway: 'stripe',
  });

  expect(authInitMock).toHaveBeenCalled();
});

test('still loads auth feature when trigger is absent', async () => {
  vi.spyOn(document, 'querySelector').mockReturnValue(null);

  await __test_bootstrap({
    storeId: 'test-store',
    supabaseUrl: 'x',
    supabaseAnonKey: 'y',
    activePaymentGateway: 'stripe',
  });

  expect(authInitMock).toHaveBeenCalled();
});
