import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let handler: (req: Request) => Promise<Response>;
let createClientMock: any;

function expectCors(
  res: Response,
  origin = "https://smoothr-cms.webflow.io",
) {
  expect(res.headers.get("access-control-allow-origin")).toBe(origin);
  expect(res.headers.get("access-control-allow-methods")).toBe(
    "GET, POST, OPTIONS",
  );
  expect(res.headers.get("access-control-allow-headers")).toBe(
    "authorization, x-client-info, apikey, content-type, x-store-id, user-agent",
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
        key === "SUPABASE_URL" ? "https://mock.supabase.co" : "mock-anon-key",
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
    await import("./get_public_store_settings/index.ts");
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
    await import("./get_public_store_settings/index.ts");
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

    await import("./get_public_store_settings/index.ts");
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
    await import("./get_public_store_settings/index.ts");
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
