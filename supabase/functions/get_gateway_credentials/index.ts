import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hostFromOrigin, preflight, withCors } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const originHost = hostFromOrigin(origin);

  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug");
  const log = (...args: any[]) =>
    debug && console.log("[get_gateway_credentials]", ...args);
  const errorLog = (...args: any[]) =>
    debug && console.error("[get_gateway_credentials]", ...args);

  try {
    if (req.method === "OPTIONS") {
      const storeId =
        url.searchParams.get("store_id") || req.headers.get("X-Store-Id");
      if (typeof storeId !== "string" || !storeId) {
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
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const { data: allowedHostsData, error: allowedHostsError } =
        await supabase.rpc(
          "get_allowed_hosts",
          { p_store_id: storeId },
        );
      if (allowedHostsError) {
        errorLog("RPC error", allowedHostsError);
        return withCors(
          new Response(
            JSON.stringify({
              error: "server_error",
              message: allowedHostsError.message,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          ),
          origin || "*",
        );
      }
      const allowedHosts = new Set<string>(
        (allowedHostsData ?? [])
          .map((h: string) => hostFromOrigin(h))
          .filter((h): h is string => !!h),
      );
      if (!originHost || !allowedHosts.has(originHost)) {
        return new Response("Origin not allowed", { status: 403 });
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

    const { data: allowedHostsData, error: allowedHostsError } =
      await supabase.rpc(
        "get_allowed_hosts",
        { p_store_id: store_id },
      );
    if (allowedHostsError) {
      errorLog("RPC error", allowedHostsError);
      return withCors(
        new Response(
          JSON.stringify({
            error: "server_error",
            message: allowedHostsError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        ),
        origin || "*",
      );
    }
    const allowedHosts = new Set<string>(
      (allowedHostsData ?? [])
        .map((h: string) => hostFromOrigin(h))
        .filter((h): h is string => !!h),
    );
    if (!originHost || !allowedHosts.has(originHost)) {
      return new Response("Origin not allowed", { status: 403 });
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
