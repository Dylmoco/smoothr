import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const allowedOrigin =
  process.env.TEST_ALLOWED_ORIGIN || "https://www.example-live.com";
const disallowedOrigin = "https://evil.example";

let handler: (req: Request) => Promise<Response>;
let createClientMock: any;

function expectCors(res: Response) {
  expect(res.headers.get("access-control-allow-origin")).toBe(allowedOrigin);
  expect(res.headers.get("access-control-allow-methods")).toBe(
    "GET, POST, OPTIONS",
  );
  expect(res.headers.get("access-control-allow-headers")).toBe(
    "authorization, apikey, content-type, user-agent",
  );
  expect(res.headers.get("vary")).toBe("Origin");
}

beforeEach(() => {
  handler = undefined as any;
  (globalThis as any).Deno = { env: { get: () => "" } };
  createClientMock = vi.fn(() => ({
    rpc: vi.fn(async () => ({ data: [allowedOrigin], error: null })),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({
          data: { user: { user_metadata: { store_id: "s" } } },
          error: null,
        }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({
                data: {
                  publishable_key: "pk",
                  tokenization_key: "tk",
                  gateway: "g",
                  store_id: "s",
                },
                error: null,
              }),
          })),
        })),
      })),
    })),
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

describe("get_gateway_credentials CORS", () => {
  it("includes CORS headers on OPTIONS", async () => {
    await import("./get_gateway_credentials/index.ts");
    const res = await handler(
      new Request("http://localhost?store_id=s", {
        method: "OPTIONS",
        headers: { Origin: allowedOrigin },
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
        headers: { Origin: allowedOrigin },
      }),
    );
    expect(res.status).toBe(400);
    expectCors(res);
  });

  it("guest from allowed origin returns 200 with public fields", async () => {
    await import("./get_gateway_credentials/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: allowedOrigin,
        },
        body: JSON.stringify({ store_id: "s", gateway: "g" }),
      }),
    );
    expect(res.status).toBe(200);
    expectCors(res);
    expect(await res.json()).toEqual({
      publishable_key: "pk",
      tokenization_key: "tk",
      gateway: "g",
      store_id: "s",
    });
  });

  it("authorized from allowed origin returns 200", async () => {
    await import("./get_gateway_credentials/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: allowedOrigin,
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ store_id: "s", gateway: "g" }),
      }),
    );
    expect(res.status).toBe(200);
    expectCors(res);
  });

  it("guest from disallowed origin returns 403", async () => {
    await import("./get_gateway_credentials/index.ts");
    const res = await handler(
      new Request("http://localhost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: disallowedOrigin,
        },
        body: JSON.stringify({ store_id: "s", gateway: "g" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

});
