import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let handler: (req: Request) => Promise<Response>;
let createClientMock: any;

function expectCors(res: Response, origin = "https://smoothr-cms.webflow.io") {
  expect(res.headers.get("access-control-allow-origin")).toBe(origin);
  expect(res.headers.get("access-control-allow-methods")).toBe(
    "GET, POST, OPTIONS",
  );
  expect(res.headers.get("access-control-allow-headers")).toBe(
    "authorization, x-client-info, apikey, content-type, x-store-id, user-agent",
  );
}

beforeEach(() => {
  handler = undefined as any;
  (globalThis as any).Deno = {
    env: {
      get: (key: string) =>
        key === "SUPABASE_URL"
          ? process.env.SUPABASE_URL
          : key === "SUPABASE_ANON_KEY"
            ? process.env.SUPABASE_ANON_KEY
            : "",
    },
    serve: (fn: any) => {
      handler = fn;
    },
  };
  createClientMock = vi.fn(() => ({
    rpc: async () => ({ data: [], error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: "nope" },
            }),
          }),
        }),
      }),
    }),
  }));

  vi.mock("@supabase/supabase-js", () => ({
    createClient: createClientMock,
  }));
});

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete (globalThis as any).Deno;
});

describe("get_gateway_credentials CORS", () => {
  it("includes CORS headers on OPTIONS", async () => {
    await import("./get_gateway_credentials/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "OPTIONS",
        headers: { Origin: "https://smoothr-cms.webflow.io" },
      }),
    );
    expect(res.status).toBe(204);
    expectCors(res);
  });

  it("includes CORS headers on invalid method", async () => {
    await import("./get_gateway_credentials/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "GET",
        headers: { Origin: "https://forbidden.example" },
      }),
    );
    expect(res.status).toBe(400);
    expectCors(res, "https://forbidden.example");
  });

  it("includes CORS headers on 403 response", async () => {
    await import("./get_gateway_credentials/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://forbidden.example",
        },
        body: JSON.stringify({ store_id: "s", gateway: "g" }),
      }),
    );
    expect(res.status).toBe(403);
    expectCors(res, "https://forbidden.example");
  });
});
