import { vi } from 'vitest';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  vi.mock('../../../shared/supabase/browserClient.js', () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    };

    const client: any = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getSessionFromUrl: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(),
        storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
        storageKey: 'supabase-auth'
      },
      from: vi.fn(() => ({ ...chain }))
    };
    return {
      default: client,
      getClient: () => client
    };
  });
}
