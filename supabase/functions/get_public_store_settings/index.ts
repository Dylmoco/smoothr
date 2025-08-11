import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import { hostFromOrigin } from "../_shared/cors.ts";

function withCors(res: Response, origin: string = "*"): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, x-store-id, apikey, content-type, user-agent",
  );
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours cache
  return new Response(res.body, { status: res.status, headers });
}

function preflight(origin: string = "*"): Response {
  return withCors(new Response(null, { status: 204 }), origin);
}

console.info('get_public_store_settings function started');

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const originHost = hostFromOrigin(origin);
  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug");
  
  const log = (...args: any[]) => debug && console.log("[get_public_store_settings]", ...args);
  const errorLog = (...args: any[]) => debug && console.error("[get_public_store_settings]", ...args);

  try {
    const storeId = url.searchParams.get("store_id") || req.headers.get("X-Store-Id");
    if (!storeId || typeof storeId !== "string") {
      return withCors(
        new Response(
          JSON.stringify({ error: "invalid_request", message: "store_id is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        ),
        origin
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { "x-store-id": storeId } } }
    );

    if (req.method === "OPTIONS") {
      const { data: allowedHostsData, error: allowedHostsError } = await supabase.rpc("get_allowed_hosts", { p_store_id: storeId });
      if (allowedHostsError) {
        errorLog("RPC error", allowedHostsError);
        return withCors(
          new Response(
            JSON.stringify({ error: "server_error", message: allowedHostsError.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          ),
          origin
        );
      }
      const allowedHosts = new Set<string>(
        (allowedHostsData ?? []).map((h: string) => hostFromOrigin(h)).filter((h): h is string => !!h)
      );
      log("Preflight check", { originHost, allowedHosts: Array.from(allowedHosts), isAllowed: originHost && allowedHosts.has(originHost) });
      return originHost && allowedHosts.has(originHost) ? preflight(origin) : new Response(null, { status: 204 });
    }

    if (req.method !== "POST") {
      return withCors(
        new Response(
          JSON.stringify({ error: "invalid_request", message: "method must be POST" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        ),
        origin
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      errorLog("Invalid JSON", err);
      return withCors(
        new Response(
          JSON.stringify({ error: "invalid_request", message: "invalid JSON body" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        ),
        origin
      );
    }

    const { store_id: bodyStoreId } = body ?? {};
    if (!bodyStoreId || typeof bodyStoreId !== "string") {
      return withCors(
        new Response(
          JSON.stringify({ error: "invalid_request", message: "store_id is required in request body" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        ),
        origin
      );
    }

    const { data: allowedHostsData, error: allowedHostsError } = await supabase.rpc("get_allowed_hosts", { p_store_id: bodyStoreId });
    if (allowedHostsError) {
      errorLog("RPC error", allowedHostsError);
      return withCors(
        new Response(
          JSON.stringify({ error: "server_error", message: allowedHostsError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        ),
        origin
      );
    }
    const allowedHosts = new Set<string>(
      (allowedHostsData ?? []).map((h: string) => hostFromOrigin(h)).filter((h): h is string => !!h)
    );
    log("Request validation", { originHost, allowedHosts: Array.from(allowedHosts), isAllowed: originHost && allowedHosts.has(originHost) });
    const allowedOrigin = originHost && allowedHosts.has(originHost) ? origin : null;
    if (!allowedOrigin) {
      return new Response("Origin not allowed", { status: 403 });
    }

    const { data, error } = await supabase.from("public_store_settings").select("*").eq("store_id", bodyStoreId).maybeSingle();
    if (error) {
      errorLog("Query error", error);
      return withCors(
        new Response(
          JSON.stringify({ error: "forbidden", message: error.message }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        ),
        allowedOrigin
      );
    }

    const sanitized = data ? Object.fromEntries(Object.entries(data).filter(([, v]) => v != null)) : {};
    log("Response data", sanitized);

    return withCors(
      new Response(JSON.stringify(sanitized), { headers: { "Content-Type": "application/json" } }),
      allowedOrigin
    );
  } catch (err) {
    errorLog("Unexpected error", err);
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      new Response(JSON.stringify({ error: "server_error", message }), { status: 500, headers: { "Content-Type": "application/json" } }),
      origin
    );
  }
});