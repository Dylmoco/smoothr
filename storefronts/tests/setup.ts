import { beforeEach } from "vitest";
import { buildSupabaseMock, useWindowSupabaseMock } from "./utils/supabase-mock";

declare global {
  // eslint-disable-next-line no-var
  var __smoothrTest: { supabase?: any; mocks?: any } | undefined;
}

beforeEach(() => {
  console.log('storefronts/tests/setup.ts ran');
  const { client, mocks } = buildSupabaseMock();
  (globalThis as any).__smoothrTest = { supabase: client, mocks };
  useWindowSupabaseMock(client, mocks);
  // Ensure debug mode for log-based tests
  (globalThis as any).Smoothr = (globalThis as any).Smoothr || {};
  (globalThis as any).Smoothr.config = {
    ...(globalThis as any).Smoothr.config || {},
    debug: true,
  };
});
