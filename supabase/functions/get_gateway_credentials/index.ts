import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getAllowedHostsForStore,
  hostFromOrigin,
  isAllowedOrigin,
  preflight,
  withCors,
} from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const originHost = hostFromOrigin(origin);
  const allowlist = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => hostFromOrigin(s.trim()))
    .filter((s): s is string => !!s);
  const wildcard = Deno.env.get("ALLOW_ORIGIN_WILDCARD") === "true";

  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug");
  const log = (...args: any[]) =>
    debug && console.log("[get_gateway_credentials]", ...args);
  const errorLog = (...args: any[]) =>
    debug && console.error("[get_gateway_credentials]", ...args);

  try {
    if (req.method === "OPTIONS") {
      if (!wildcard && (!originHost || !allowlist.includes(originHost))) {
        return withCors(
          new Response("origin not allowed", { status: 403 }),
          origin || "*",
        );
      }
      return preflight(origin || "*");
    }

    if (req.method !== "POST") {
      return withCors(
        new Response(
          JSON.stringify({
            error: "invalid_request",
            message: "method must be POST",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
        origin || "*",
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      errorLog("Invalid JSON", err);
      return withCors(
        new Response(
          JSON.stringify({
            error: "invalid_request",
            message: "invalid JSON body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
        origin || "*",
      );
    }

    const { store_id, gateway } = body ?? {};

    log("Incoming request:", {
      store_id,
      gateway,
      headers: Object.fromEntries(req.headers),
    });

    if (typeof store_id !== "string" || !store_id) {
      return withCors(
        new Response(
          JSON.stringify({
            error: "invalid_request",
            message: "store_id is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
        origin || "*",
      );
    }

    if (typeof gateway !== "string" || !gateway) {
      return withCors(
        new Response(
          JSON.stringify({
            error: "invalid_request",
            message: "gateway is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
        origin || "*",
      );
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      authHeader
        ? { global: { headers: { Authorization: authHeader } } }
        : undefined,
    );

    if (authHeader) {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user) {
        return withCors(
          new Response(
            JSON.stringify({
              error: "invalid_request",
              message: "invalid token",
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            },
          ),
          origin || "*",
        );
      }
      const claimStoreId = user.user.user_metadata?.store_id;
      if (claimStoreId && claimStoreId !== store_id) {
        return withCors(
          new Response(
            JSON.stringify({
              error: "invalid_request",
              message: "store_id claim mismatch",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          ),
          origin || "*",
        );
      }
    }

    if (!wildcard && (!originHost || !allowlist.includes(originHost))) {
      const allowed = await getAllowedHostsForStore(store_id, supabase);
      if (allowed.size === 0 || !isAllowedOrigin(originHost, allowed)) {
        return withCors(
          new Response("Origin not allowed", { status: 403 }),
          origin || "*",
        );
      }
    }

    const { data, error } = await supabase
      .from("public_store_integration_credentials")
      .select("publishable_key, tokenization_key, gateway, store_id")
      .eq("store_id", store_id)
      .eq("gateway", gateway)
      .maybeSingle();

    if (error) {
      errorLog("Query error", error);
      return withCors(
        new Response(
          JSON.stringify({ error: "forbidden", message: error.message }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        ),
        origin || "*",
      );
    }

    const responsePayload = {
      publishable_key: data?.publishable_key ?? null,
      tokenization_key: data?.tokenization_key ?? null,
      gateway: data?.gateway ?? gateway,
      store_id: data?.store_id ?? store_id,
    };

    log("response", responsePayload);

    return withCors(
      new Response(JSON.stringify(responsePayload), {
        headers: { "Content-Type": "application/json" },
      }),
      origin || "*",
    );
  } catch (err) {
    errorLog("Unexpected error", err);
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      new Response(JSON.stringify({ error: "server_error", message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
      origin || "*",
    );
  }
});
