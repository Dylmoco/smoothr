import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import { hostFromOrigin } from "../_shared/cors.ts";

// Import shared CORS utilities
function withCors(res: Response, origin: string = "*"): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, x-store-id, apikey, content-type, user-agent",
  );
  headers.set("Vary", "Origin");
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
    // Get store_id from query params or headers
    const storeId = url.searchParams.get("store_id") || req.headers.get("X-Store-Id");
    
    if (!storeId || typeof storeId !== "string") {
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "invalid_request", 
            message: "store_id is required" 
          }), 
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // Initialize Supabase client with the ANON key
    // This will respect RLS policies on tables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { 
        headers: { "x-store-id": storeId } 
      } 
    });

    // Handle OPTIONS preflight request
    if (req.method === "OPTIONS") {
      // Get allowed hosts for this store dynamically
      const { data: allowedHostsData, error: allowedHostsError } = 
        await supabase.rpc("get_allowed_hosts", { p_store_id: storeId });

      if (allowedHostsError) {
        errorLog("RPC error", allowedHostsError);
        return withCors(
          new Response(
            JSON.stringify({ 
              error: "server_error", 
              message: allowedHostsError.message 
            }), 
            { 
              status: 500, 
              headers: { "Content-Type": "application/json" } 
            }
          ),
          origin
        );
      }

      // Process allowed hosts
      const allowedHosts = new Set<string>(
        (allowedHostsData ?? [])
          .map((h: string) => hostFromOrigin(h))
          .filter((h): h is string => !!h)
      );

      log("Preflight check", {
        originHost,
        allowedHosts: Array.from(allowedHosts),
        isAllowed: originHost && allowedHosts.has(originHost)
      });

      // Only allow preflight if origin is in allowed hosts
      if (originHost && allowedHosts.has(originHost)) {
        return preflight(origin);
      }

      // Return 204 but without CORS headers for disallowed origins
      return new Response(null, { status: 204 });
    }

    if (req.method !== "POST") {
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "invalid_request", 
            message: "method must be POST" 
          }), 
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      errorLog("Invalid JSON", err);
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "invalid_request", 
            message: "invalid JSON body" 
          }), 
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // Validate store_id in body
    const { store_id: bodyStoreId } = body ?? {};
    if (!bodyStoreId || typeof bodyStoreId !== "string") {
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "invalid_request", 
            message: "store_id is required in request body" 
          }), 
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // Use the store_id from the body to verify allowed origins
    const { data: allowedHostsData, error: allowedHostsError } = 
      await supabase.rpc("get_allowed_hosts", { p_store_id: bodyStoreId });

    if (allowedHostsError) {
      errorLog("RPC error", allowedHostsError);
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "server_error", 
            message: allowedHostsError.message 
          }), 
          { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // Process allowed hosts and check origin
    const allowedHosts = new Set<string>(
      (allowedHostsData ?? [])
        .map((h: string) => hostFromOrigin(h))
        .filter((h): h is string => !!h)
    );
    
    log("Request validation", {
      originHost,
      allowedHosts: Array.from(allowedHosts),
      isAllowed: originHost && allowedHosts.has(originHost)
    });

    // Only respond with CORS headers if origin is allowed
    const allowedOrigin = originHost && allowedHosts.has(originHost) ? origin : null;
    if (!allowedOrigin) {
      return new Response("Origin not allowed", { status: 403 });
    }

    // Query the public_store_settings table with RLS applied based on store_id
    // This will respect any RLS policies on the table since we're using the anon key
    const { data, error } = await supabase
      .from("public_store_settings")
      .select("*")
      .eq("store_id", bodyStoreId)
      .maybeSingle();

    if (error) {
      errorLog("Query error", error);
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "forbidden", 
            message: error.message 
          }), 
          { 
            status: 403, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        allowedOrigin
      );
    }

    // Clean up response data by removing null values
    const sanitized = data 
      ? Object.fromEntries(Object.entries(data).filter(([, v]) => v != null)) 
      : {};
    
    log("Response data", sanitized);

    return withCors(
      new Response(
        JSON.stringify(sanitized), 
        { headers: { "Content-Type": "application/json" } }
      ),
      allowedOrigin
    );
    
  } catch (err) {
    errorLog("Unexpected error", err);
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      new Response(
        JSON.stringify({ error: "server_error", message }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      ),
      origin
    );
  }
});