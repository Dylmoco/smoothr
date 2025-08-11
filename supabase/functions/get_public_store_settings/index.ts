import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hostFromOrigin, preflight, withCors } from "../_shared/cors.ts";

serve(async (req) => {
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
        new Response(JSON.stringify({ error: "invalid_request", message: "store_id is required" }), { status: 400, headers: { "Content-Type": "application/json" } }),
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
          new Response(JSON.stringify({ error: "server_error", message: allowedHostsError.message }), { status: 500, headers: { "Content-Type": "application/json" } }),
          origin
        );
      }
      const allowedHosts = new Set<string>((allowedHostsData ?? []).map((h: string) => hostFromOrigin(h)).filter((h): h is string => !!h));
      const allowedOrigin = originHost && allowedHosts.has(originHost) ? origin : null;
      return allowedOrigin ? preflight(allowedOrigin) : withCors(new Response("Origin not allowed", { status: 403 }), origin);
    }

    if (req.method !== "POST") {
      return withCors(
        new Response(JSON.stringify({ error: "invalid_request", message: "method must be POST" }), { status: 400, headers: { "Content-Type": "application/json" } }),
        origin
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      errorLog("Invalid JSON", err);
      return withCors(
        new Response(JSON.stringify({ error: "invalid_request", message: "invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } }),
        origin
      );
    }

    const { store_id: bodyStoreId } = body ?? {};
    if (!bodyStoreId || typeof bodyStoreId !== "string") {
      return withCors(
        new Response(JSON.stringify({ error: "invalid_request", message: "store_id is required" }), { status: 400, headers: { "Content-Type": "application/json" } }),
        origin
      );
    }

    const { data: allowedHostsData, error: allowedHostsError } = await supabase.rpc("get_allowed_hosts", { p_store_id: bodyStoreId });
    if (allowedHostsError) {
      errorLog("RPC error", allowedHostsError);
      return withCors(
        new Response(JSON.stringify({ error: "server_error", message: allowedHostsError.message }), { status: 500, headers: { "Content-Type": "application/json" } }),
        origin
      );
    }
    const allowedHosts = new Set<string>((allowedHostsData ?? []).map((h: string) => hostFromOrigin(h)).filter((h): h is string => !!h));
    const allowedOrigin = originHost && allowedHosts.has(originHost) ? origin : null;
    if (!allowedOrigin) {
      return withCors(new Response("Origin not allowed", { status: 403 }), origin);
    }

    const { data, error } = await supabase.from("public_store_settings").select("*").eq("store_id", bodyStoreId).maybeSingle();
    if (error) {
      errorLog("Query error", error);
      return withCors(
        new Response(JSON.stringify({ error: "forbidden", message: error.message }), { status: 403, headers: { "Content-Type": "application/json" } }),
        allowedOrigin
      );
    }

    const sanitized = data ? Object.fromEntries(Object.entries(data).filter(([, v]) => v != null)) : {};
    log("response", sanitized);

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