import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, withCors } from "../_shared/cors.ts";

const origin = "https://smoothr-cms.webflow.io";

serve(async (req) => {
  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug");
  const log = (...args: any[]) =>
    debug && console.log("[get_public_store_settings]", ...args);
  const errorLog = (...args: any[]) =>
    debug && console.error("[get_public_store_settings]", ...args);

  try {
    if (req.method === "OPTIONS") {
      return preflight(origin);
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
        origin,
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
        origin,
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
        origin,
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
          origin,
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
          origin,
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
        origin,
      );
    }

    const sanitized = data
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v != null))
      : {};

    log("response", sanitized);

    return withCors(
      new Response(JSON.stringify(sanitized), {
        headers: { "Content-Type": "application/json" },
      }),
      origin,
    );
  } catch (err) {
    errorLog("Unexpected error", err);
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      new Response(JSON.stringify({ error: "server_error", message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
      origin,
    );
  }
});
