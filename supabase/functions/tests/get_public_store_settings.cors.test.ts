import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let handler: (req: Request) => Promise<Response>;
let createClientMock: any;

vi.mock("../_shared/cors.ts", async () => {
  const { allowCors, handleCorsPreflightRequest } = await import("../utils/cors.ts");
  return {
    preflight: (origin: string) =>
      handleCorsPreflightRequest(
        new Request("http://localhost", {
          method: "OPTIONS",
          headers: { Origin: origin },
        }),
      )!,
    withCors: (resp: Response, origin: string) =>
      allowCors(
        new Request("http://localhost", { headers: { Origin: origin } }),
        resp,
      ),
  };
});

function expectCors(
  res: Response,
  origin = "https://smoothr-cms.webflow.io",
) {
  console.debug("CORS check", res.status, origin);
  expect(res.headers.get("access-control-allow-origin")).toBe(origin);
  expect(res.headers.get("access-control-allow-methods")).toBe(
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  expect(res.headers.get("access-control-allow-headers")).toBe(
    "Content-Type, Authorization, X-Client-Info",
  );
  if (res.status !== 204) {
    expect(res.headers.get("content-type")).toBe("application/json");
  }
}

beforeEach(() => {
  handler = undefined as any;
  (globalThis as any).Deno = {
    env: {
      get: vi.fn((key) =>
        key === "SUPABASE_URL" ? process.env.SUPABASE_URL : "mock-anon-key",
      ),
    },
    serve: (fn: any) => {
      handler = fn;
    },
  };
  createClientMock = vi.fn(() => ({
    rpc: async () => ({ data: ["smoothr-cms.webflow.io"], error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { base_currency: "USD", public_settings: {} },
            error: null,
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

describe("get_public_store_settings CORS", () => {
  it("includes CORS headers on OPTIONS", async () => {
    await import("../get_public_store_settings/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "OPTIONS",
        headers: { Origin: "https://smoothr-cms.webflow.io" },
      }),
    );
    expect(res.status).toBe(204);
    expectCors(res);
  });

  it("includes CORS headers on success", async () => {
    await import("../get_public_store_settings/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://smoothr-cms.webflow.io",
        },
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

    await import("../get_public_store_settings/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://smoothr-cms.webflow.io",
        },
        body: JSON.stringify({ store_id: "s1" }),
      }),
    );
    expect(res.status).toBe(500);
    expectCors(res);
    expect(await res.json()).toMatchObject({
      error: "server_error",
      message: "boom",
    });
  });

  it("includes CORS headers on invalid body", async () => {
    await import("../get_public_store_settings/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: { Origin: "https://forbidden.example" },
      }),
    );
    expect(res.status).toBe(400);
    expectCors(res, "https://forbidden.example");
  });
});
