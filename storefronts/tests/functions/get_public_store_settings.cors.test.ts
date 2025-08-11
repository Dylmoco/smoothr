import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testOrigin = process.env.TEST_ALLOWED_ORIGIN || "https://www.example-live.com";
const disallowedOrigin = "https://evil.example";

let handler: (req: Request) => Promise<Response>;
let createClientMock: any;

function expectCors(res: Response) {
  expect(res.headers.get("access-control-allow-origin")).toBe(testOrigin);
  expect(res.headers.get("access-control-allow-methods")).toBe(
    "GET, POST, OPTIONS",
  );
  expect(res.headers.get("access-control-allow-headers")).toBe(
    "authorization, apikey, content-type, user-agent",
  );
  expect(res.headers.get("vary")).toBe("Origin");
  if (res.status !== 204) {
    expect(res.headers.get("content-type")).toBe("application/json");
  }
}

beforeEach(() => {
  handler = undefined as any;
  (globalThis as any).Deno = { env: { get: () => "" } };
  createClientMock = vi.fn(() => ({
    rpc: vi.fn(async () => ({ data: [testOrigin], error: null })),
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { foo: "bar" }, error: null }),
        }),
      }),
    }),
  }));

  vi.mock("https://deno.land/std@0.177.0/http/server.ts", () => ({
    serve: (fn: any) => {
      handler = fn;
    },
  }));
  vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({
    createClient: createClientMock,
  }));
});

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete (globalThis as any).Deno;
});

describe("get_public_store_settings CORS", () => {
  it("includes CORS headers on OPTIONS", async () => {
    await import(
      "../../../supabase/functions/get_public_store_settings/index.ts"
    );
    const res = await handler(
      new Request("http://localhost?store_id=s1", {
        method: "OPTIONS",
        headers: { Origin: testOrigin },
      }),
    );
    expect(res.status).toBe(204);
    expectCors(res);
  });

  it("includes CORS headers on success", async () => {
    await import(
      "../../../supabase/functions/get_public_store_settings/index.ts"
    );
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: testOrigin },
        body: JSON.stringify({ store_id: "s1" }),
      }),
    );
    expect(res.status).toBe(200);
    expectCors(res);
  });

  it("includes CORS headers on thrown error", async () => {
    (globalThis as any).Deno.env.get = () => {
      throw new Error("boom");
    };

    await import(
      "../../../supabase/functions/get_public_store_settings/index.ts"
    );
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: testOrigin },
        body: JSON.stringify({ store_id: "s1" }),
      }),
    );
    expect(res.status).toBe(500);
    expectCors(res);
    expect(await res.json()).toEqual({
      error: "server_error",
      message: "boom",
    });
  });

  it("includes CORS headers on invalid body", async () => {
    await import(
      "../../../supabase/functions/get_public_store_settings/index.ts"
    );
    const res = await handler(
      new Request("http://localhost", { method: "POST", headers: { Origin: testOrigin } }),
    );
    expect(res.status).toBe(400);
    expectCors(res);
  });

  it("returns 403 for disallowed origin", async () => {
    await import(
      "../../../supabase/functions/get_public_store_settings/index.ts",
    );
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: disallowedOrigin,
        },
        body: JSON.stringify({ store_id: "s1" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});
