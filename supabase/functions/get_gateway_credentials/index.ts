// verify_jwt disabled at deploy; function is POST-only; returns safe fields
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const CACHE_HEADER = "public, max-age=60, stale-while-revalidate=600";

serve(async (req) => {
  let corsHeaders: Record<string, string> | undefined;
  try {
    corsHeaders = getCorsHeaders(req);
    const url = new URL(req.url);
    const debug = url.searchParams.has("smoothr-debug");
    const log = (...args: any[]) => debug && console.log("[get_gateway_credentials]", ...args);
    const errorLog = (...args: any[]) => debug && console.error("[get_gateway_credentials]", ...args);
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
    const { store_id, gateway } = body ?? {};
    if (typeof store_id !== "string" || !store_id) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "store_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
        },
      );
    }
    if (typeof gateway !== "string" || !gateway) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "gateway is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": CACHE_HEADER },
        },
      );
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .rpc("get_public_gateway_credentials", { store_id, gateway })
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
    const responsePayload = {
      publishable_key: data?.publishable_key ?? null,
      tokenization_key: data?.tokenization_key ?? null,
      gateway,
      store_id,
    };
    log("response", responsePayload);
    return new Response(JSON.stringify(responsePayload), {
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
