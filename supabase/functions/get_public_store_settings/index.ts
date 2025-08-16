import { createSupabaseClient } from "../_shared/supabase-client.ts";

// Helper function to extract host from origin
function hostFromOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    const raw = origin.replace(/^https?:\/\//i, "").toLowerCase();
    return raw.split("/")[0] || null;
  }
}

// Add CORS headers to response
function withCors(res: Response, origin: string = "*"): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type, x-store-id, user-agent",
  );
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
  return new Response(res.body, { status: res.status, headers });
}

// Create preflight response
function preflight(origin: string = "*"): Response {
  return withCors(new Response(null, { status: 204 }), origin);
}

// Debug helper function
function debugLog(debug: boolean, prefix: string, ...args: any[]) {
  if (debug) {
    console.log(`[${prefix}]`, ...args);
  }
}

console.info('get_public_store_settings function started');

// List of allowed domains
const ALLOWED_TEST_DOMAINS = [
  'smoothr-cms.webflow.io',
  'localhost',
  '127.0.0.1',
  'smoothr.vercel.app'
];

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const originHost = hostFromOrigin(origin);
  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug") || true; // Enable debug for now
  
  const log = (...args: any[]) => debugLog(debug, "get_public_store_settings", ...args);
  
  // For OPTIONS requests, always return 204 with CORS headers immediately
  if (req.method === "OPTIONS") {
    log("Handling OPTIONS request from:", originHost);
    return preflight(origin);
  }

  try {
    // Get store_id from query params
    let storeId = url.searchParams.get("store_id");
    
    // Get from X-Store-Id header (case insensitive)
    if (!storeId) {
      // Headers are case-insensitive, so we need to check in a case-insensitive way
      for (const [key, value] of req.headers.entries()) {
        if (key.toLowerCase() === 'x-store-id' && value) {
          storeId = value;
          log("Found store_id in header:", key, value);
          break;
        }
      }
    }

    // Log all headers for debugging
    const headerObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headerObj[key.toLowerCase()] = value;
    });
    
    log("Request headers:", headerObj);
    
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Try to get the store_id from the request body if it's a POST/PUT
    if (!storeId && (req.method === "POST" || req.method === "PUT")) {
      try {
        // Clone request to keep body readable
        const clonedReq = req.clone();
        
        const contentType = req.headers.get("content-type") || "";
        
        if (contentType.includes("application/json")) {
          const requestText = await clonedReq.text();
          log("Request body text:", requestText);
          
          try {
            const body = JSON.parse(requestText);
            log("Parsed JSON body:", body);
            
            // Try to get store_id from various possible locations in the body
            if (body?.store_id) {
              storeId = body.store_id;
              log("Found store_id in body.store_id:", storeId);
            } else if (body?.storeId) {
              storeId = body.storeId;
              log("Found store_id in body.storeId:", storeId);
            } else if (body?.config?.storeId) {
              storeId = body.config.storeId;
              log("Found store_id in body.config.storeId:", storeId);
            } else if (body?.data?.store_id) {
              storeId = body.data.store_id;
              log("Found store_id in body.data.store_id:", storeId);
            } else if (body?.data?.storeId) {
              storeId = body.data.storeId;
              log("Found store_id in body.data.storeId:", storeId);
            }
          } catch (err) {
            log("Failed to parse JSON body:", err);
          }
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          try {
            const formData = await clonedReq.formData();
            const formStoreId = formData.get("store_id") || formData.get("storeId");
            if (formStoreId) {
              storeId = String(formStoreId);
              log("Found store_id in form data:", storeId);
            }
          } catch (err) {
            log("Failed to parse form data:", err);
          }
        }
      } catch (err) {
        log("Error processing request body:", err);
      }
    }

    // The specific store ID for testing
    const testStoreId = "a3fea30b-8a63-4a72-9040-6049d88545d0";
    
    // If we're coming from an allowed test domain and still don't have store_id, 
    // use the test store ID for development
    if (!storeId && originHost && ALLOWED_TEST_DOMAINS.some(domain => originHost.includes(domain))) {
      storeId = testStoreId;
      log("Using test store ID for test domain:", storeId);
    }
    
    // If still no store_id, reject the request
    if (!storeId) {
      log("No store_id found in request");
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "invalid_request", 
            message: "store_id is required (not found in query params, headers, or request body)",
            debug: {
              requestUrl: req.url,
              headers: headerObj,
              origin,
              originHost
            }
          }), 
          { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // For test domains, skip origin validation
    let skipOriginValidation = false;
    if (originHost && ALLOWED_TEST_DOMAINS.some(domain => originHost.includes(domain))) {
      log("Test domain detected, skipping origin validation:", originHost);
      skipOriginValidation = true;
    }

    // For non-test domains, validate origin
    if (!skipOriginValidation) {
      log("Validating origin:", originHost, "for store:", storeId);
      
      const { data: allowedHostsData, error: allowedHostsError } = 
        await supabase.rpc("get_allowed_hosts", { p_store_id: storeId });

      if (allowedHostsError) {
        log("RPC error:", allowedHostsError);
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

      // Convert allowed hosts to normalized format for comparison
      const allowedHosts = new Set<string>(
        (allowedHostsData ?? [])
          .map((h: string) => {
            const host = hostFromOrigin(h);
            log("Normalized host:", h, "->", host);
            return host;
          })
          .filter((h): h is string => !!h)
      );
      
      log("Origin validation result:", {
        originHost,
        allowedHosts: Array.from(allowedHosts),
        isAllowed: originHost && (
          allowedHosts.has(originHost) || 
          Array.from(allowedHosts).some(h => originHost?.includes(h) || h?.includes(originHost))
        )
      });

      // More lenient matching for development
      const isAllowed = originHost && (
        allowedHosts.has(originHost) || 
        Array.from(allowedHosts).some(h => originHost?.includes(h) || h?.includes(originHost))
      );

      // Reject if origin is not allowed
      if (!isAllowed) {
        return withCors(
          new Response(
            JSON.stringify({ 
              error: "forbidden", 
              message: `Origin ${originHost} not allowed for store ${storeId}`,
              debug: {
                originHost,
                allowedHosts: Array.from(allowedHosts)
              }
            }), 
            { 
              status: 403, 
              headers: { "Content-Type": "application/json" } 
            }
          ),
          origin
        );
      }
    }

    // Query public store configuration
    log("Querying store settings from v_public_store for:", storeId);

    const { data, error } = await supabase
      .from("v_public_store")
      .select("base_currency, public_settings")
      .eq("store_id", storeId)
      .single();

    if (error) {
      log("Query error:", error);
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "database_error", 
            message: error.message,
            debug: { storeId }
          }), 
          { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    if (!data) {
      log("No settings found for store:", storeId);
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "not_found", 
            message: `No settings found for store ${storeId}`,
            debug: { storeId }
          }), 
          { 
            status: 404, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // Clean up response data
    const sanitized = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v != null)
    );
    
    log("Response data:", sanitized);

    return withCors(
      new Response(
        JSON.stringify(sanitized), 
        { headers: { "Content-Type": "application/json" } }
      ),
      origin
    );
    
  } catch (err) {
    console.error("Unexpected error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      new Response(
        JSON.stringify({ 
          error: "server_error", 
          message,
          stack: err instanceof Error ? err.stack : undefined
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      ),
      origin
    );
  }
});