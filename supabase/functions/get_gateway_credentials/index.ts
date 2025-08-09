import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://smoothr-cms.webflow.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  Vary: "Origin",
};

serve(async (req) => {
  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug");
  const log = (...args: any[]) => debug && console.log("[get_gateway_credentials]", ...args);
  const errorLog = (...args: any[]) => debug && console.error("[get_gateway_credentials]", ...args);

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...corsHeaders } });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "method must be POST" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { store_id, gateway } = body ?? {};

    if (typeof store_id !== "string" || !store_id) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "store_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (typeof gateway !== "string" || !gateway) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "gateway is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined,
    );

    if (authHeader) {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user) {
        return new Response(
          JSON.stringify({ error: "invalid_request", message: "invalid token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const claimStoreId = user.user.user_metadata?.store_id;
      if (claimStoreId && claimStoreId !== store_id) {
        return new Response(
          JSON.stringify({ error: "invalid_request", message: "store_id claim mismatch" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
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
      return new Response(
        JSON.stringify({ error: "forbidden", message: error.message }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const responsePayload = {
      publishable_key: data?.publishable_key ?? null,
      tokenization_key: data?.tokenization_key ?? null,
      gateway: data?.gateway ?? gateway,
      store_id: data?.store_id ?? store_id,
    };

    log("response", responsePayload);

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    errorLog("Unexpected error", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: "server_error", message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
