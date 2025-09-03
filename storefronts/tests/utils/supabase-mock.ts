import { vi } from "vitest";
import { __setSupabaseReadyForTests } from '../../smoothr-sdk.js';

export type SupabaseClientMock = ReturnType<typeof buildSupabaseMock>["client"];
export type SupabaseClientMocks = ReturnType<typeof buildSupabaseMock>["mocks"];

export function buildSupabaseMock(overrides: Partial<SupabaseClientMock> = {}) {
  // Auth mocks commonly used across tests
  const getUserMock = vi.fn(); // resolve null user by default at call site
  const getSessionMock = vi.fn().mockResolvedValue({ data: { session: {} }, error: null });
  const signInMock = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
  const signUpMock = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
  const signInWithOAuthMock = vi.fn().mockResolvedValue({});
  const resetPasswordMock = vi.fn().mockResolvedValue({ data: {}, error: null });
  const updateUserMock = vi.fn().mockResolvedValue({ data: {}, error: null });
  const setSessionMock = vi.fn().mockResolvedValue({ data: {}, error: null });
  const signOutMock = vi.fn();
  const onAuthStateChangeMock = vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));

  // Data/functions mocks
  const fromSelectMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromMock = vi.fn(() => ({ select: fromSelectMock }));
  const functionsInvokeMock = vi.fn().mockResolvedValue({ data: null, error: null });

  const client: any = {
    auth: {
      getUser: getUserMock,
      getSession: getSessionMock,
      signInWithPassword: signInMock,
      signUp: signUpMock,
      signInWithOAuth: signInWithOAuthMock,
      resetPasswordForEmail: resetPasswordMock,
      updateUser: updateUserMock,
      setSession: setSessionMock,
      signOut: signOutMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
    from: fromMock,
    functions: { invoke: functionsInvokeMock },
    ...overrides,
  };

  const mocks = {
    getUserMock,
    getSessionMock,
    signInMock,
    signUpMock,
    signInWithOAuthMock,
    resetPasswordMock,
    updateUserMock,
    setSessionMock,
    signOutMock,
    onAuthStateChangeMock,
    fromMock,
    fromSelectMock,
    functionsInvokeMock,
  };

  return { client, mocks };
}

export function useWindowSupabaseMock(client: SupabaseClientMock, mocks?: SupabaseClientMocks) {
  const w: any = (globalThis as any).window || (globalThis as any);
  w.Smoothr = w.Smoothr || {};
  __setSupabaseReadyForTests(client);
  // stash mocks for easy access in specs
  (globalThis as any).__smoothrTest = { ...(globalThis as any).__smoothrTest, supabase: client, mocks };
}

export function currentSupabaseMocks(): SupabaseClientMocks {
  return ((globalThis as any).__smoothrTest || {}).mocks;
}

// Back-compat for specs that expect to call createClientMock()
export function createClientMock() {
  const { client, mocks } = buildSupabaseMock();
  useWindowSupabaseMock(client, mocks);
  return client;
}
