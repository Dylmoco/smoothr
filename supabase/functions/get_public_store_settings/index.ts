import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, withCors } from "../_shared/cors.ts";

serve(async (req) => {
  const reqOrigin = req.headers.get("Origin") ?? "";
  const allowlist = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const wildcard = Deno.env.get("ALLOW_ORIGIN_WILDCARD") === "true";

  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug");
  const log = (...args: any[]) =>
    debug && console.log("[get_public_store_settings]", ...args);
  const errorLog = (...args: any[]) =>
    debug && console.error("[get_public_store_settings]", ...args);

  try {
    if (req.method === "OPTIONS") {
      if (allowlist.length > 0 && !allowlist.includes(reqOrigin) && !wildcard) {
        return new Response("origin not allowed", { status: 403 });
      }
      return preflight(reqOrigin);
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
        reqOrigin,
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
        reqOrigin,
      );
    }

    const { store_id } = body ?? {};

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
        reqOrigin,
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
          reqOrigin,
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
          reqOrigin,
        );
      }
    }

    const { data, error } = await supabase
      .from("public_store_settings")
      .select("*")
      .eq("store_id", store_id)
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
        reqOrigin,
      );
    }

    const sanitized = data
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v != null))
      : {};

    let allowedOrigin = reqOrigin;
    if (allowlist.length > 0) {
      if (!allowlist.includes(reqOrigin)) {
        return new Response("origin not allowed", { status: 403 });
      }
    } else if (!wildcard) {
      const domain = sanitized.api_base || "";
      if (domain && !reqOrigin.endsWith(domain)) {
        return new Response("origin not allowed", { status: 403 });
      }
    }

    log("response", sanitized);

    return withCors(
      new Response(JSON.stringify(sanitized), {
        headers: { "Content-Type": "application/json" },
      }),
      allowedOrigin,
    );
  } catch (err) {
    errorLog("Unexpected error", err);
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      new Response(JSON.stringify({ error: "server_error", message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
      reqOrigin,
    );
  }
});
