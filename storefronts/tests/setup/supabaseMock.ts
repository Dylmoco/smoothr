import { vi, beforeAll } from 'vitest';

// 1) Provide stable env (some modules read these on import)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';

// 2) Stable mock client used everywhere
const mockClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
    update: vi.fn().mockResolvedValue({ data: {}, error: null }),
    delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
    eq: vi.fn().mockReturnValue(this),
  }),
};

// 3) Mock the factory so any init path returns the same client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => mockClient),
  };
});

// 4) Some tests rely on a browser-ish global
//    Provide a minimal window.Smoothr if referenced by code
(globalThis as any).Smoothr = (globalThis as any).Smoothr || { config: {} };

// 5) Ensure mocks are active before any test file runs
beforeAll(() => {
  // no-op; presence ensures file is executed
});

const noop = () => {};
// vi.spyOn(console, 'warn').mockImplementation(noop);
// vi.spyOn(console, 'info').mockImplementation(noop);
