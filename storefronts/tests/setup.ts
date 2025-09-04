import { beforeEach } from "vitest";
import { buildSupabaseMock, useWindowSupabaseMock } from "./utils/supabase-mock";

declare global {
  // eslint-disable-next-line no-var
  var __smoothrTest: { supabase?: any; mocks?: any } | undefined;
}

beforeEach(() => {
  const { client, mocks } = buildSupabaseMock();
  (globalThis as any).__smoothrTest = { supabase: client, mocks };
  useWindowSupabaseMock(client, mocks);
});
