// verify_jwt disabled at deploy; function is POST-only; returns safe fields
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const CACHE_HEADER = "public, max-age=60, stale-while-revalidate=600";

const SAFE_FIELDS = new Set([
  "store_id",
  "theme",
  "logo",
  "currency",
  "debug",
  "api_base",
  "platform",
  "rate_source",
  "base_currency",
  "active_payment_gateway",
  "account_deleted_redirect_url",
  "dashboard_home_url",
  "login_redirect_url",
  "logout_redirect_url",
  "password_reset_redirect_url",
  "payment_failure_redirect_url",
  "payment_success_redirect_url",
  "signup_redirect_url",
]);

serve(async (req) => {
  let corsHeaders: Record<string, string> | undefined;
  try {
    corsHeaders = getCorsHeaders(req);
    const url = new URL(req.url);
    const debug = url.searchParams.has("smoothr-debug");
    const log = (...args: any[]) => debug && console.log("[get_public_store_settings]", ...args);
    const errorLog = (...args: any[]) => debug && console.error("[get_public_store_settings]", ...args);
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders, "Cache-Control": CACHE_HEADER },
      });
    }
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "method must be POST" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
        },
      );
    }
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.toLowerCase().includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "content-type must be application/json" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
        },
      );
    }
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      errorLog("Invalid JSON", err);
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
        },
      );
    }
    const { store_id } = body ?? {};
    if (typeof store_id !== "string" || !store_id) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "store_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
        },
      );
    }
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      undefined,
      undefined,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined,
    );
    if (authHeader) {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user) {
        return new Response(
          JSON.stringify({ error: "invalid_request", message: "invalid token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
          },
        );
      }
      const claimStoreId = user.user.user_metadata?.store_id;
      if (claimStoreId && claimStoreId !== store_id) {
        return new Response(
          JSON.stringify({ error: "invalid_request", message: "store_id claim mismatch" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
          },
        );
      }
    }
    const { data, error } = await supabase
      .rpc("get_public_store_settings", { p_store_id: store_id })
      .maybeSingle();
    if (error) {
      errorLog("Query error", error);
      return new Response(
        JSON.stringify({ error: "forbidden", message: error.message }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
        },
      );
    }
    const sanitized = data
      ? Object.fromEntries(
          Object.entries(data).filter(([k, v]) => SAFE_FIELDS.has(k) && v != null),
        )
      : {};
    log("response", sanitized);
    return new Response(JSON.stringify(sanitized), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const headers = {
      ...(corsHeaders ?? {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type",
        Vary: "Origin",
      }),
      "Content-Type": "application/json",
      "Cache-Control": CACHE_HEADER,
    };
    return new Response(JSON.stringify({ error: "server_error", message }), {
      status: 500,
      headers,
    });
  }
});
