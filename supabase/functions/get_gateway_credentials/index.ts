import { createSupabaseClient } from "../_shared/supabase-client.ts";
import { withCors, preflight } from "../_shared/cors.ts";

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

// Debug helper function
function debugLog(debug: boolean, prefix: string, ...args: any[]) {
  if (debug) {
    console.log(`[${prefix}]`, ...args);
  }
}

console.info('get_gateway_credentials function started');

// List of allowed test domains
const ALLOWED_TEST_DOMAINS = [
  'smoothr-cms.webflow.io',
  'localhost',
  '127.0.0.1'
];

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const originHost = hostFromOrigin(origin);
  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug") || true; // Enable debug by default
  
  const log = (...args: any[]) => debugLog(debug, "get_gateway_credentials", ...args);
  
  // For OPTIONS requests, always return 204 with CORS headers immediately
  if (req.method === "OPTIONS") {
    log("Handling OPTIONS request from:", originHost);
    return preflight(origin);
  }

  try {
    // Get store_id from various sources
    let storeId = url.searchParams.get("store_id");
    
    // Get from X-Store-Id header (case insensitive)
    if (!storeId) {
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

    // Handle POST request body
    if (!storeId && req.method === "POST") {
      let body = {};
      
      try {
        // Clone the request to keep the original body readable
        const clonedReq = req.clone();
        const contentType = req.headers.get("content-type") || "";
        
        if (contentType.includes("application/json")) {
          try {
            const requestText = await clonedReq.text();
            log("Request body text:", requestText);
            
            body = JSON.parse(requestText);
            log("Parsed JSON body:", body);
            
            // Try all possible locations for store_id
            storeId = body?.store_id || body?.storeId || 
                     body?.data?.store_id || body?.data?.storeId || 
                     body?.config?.storeId || null;
                     
            if (storeId) {
              log("Found store_id in body:", storeId);
            }
          } catch (e) {
            log("Error parsing JSON:", e);
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
              headers: headerObj
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

    // Get gateway from query params, body or use default
    let gateway = url.searchParams.get("gateway");
    
    if (!gateway && req.method === "POST") {
      try {
        // Clone the request to keep the original body readable
        const clonedReq = req.clone();
        const contentType = req.headers.get("content-type") || "";
        
        if (contentType.includes("application/json")) {
          try {
            const body = await clonedReq.json().catch(() => ({}));
            gateway = body?.gateway || null;
            
            if (gateway) {
              log("Found gateway in body:", gateway);
            }
          } catch (e) {
            log("Error parsing JSON for gateway:", e);
          }
        }
      } catch (err) {
        log("Error processing request body for gateway:", err);
      }
    }

    // Default gateway if not provided
    if (!gateway && originHost && ALLOWED_TEST_DOMAINS.some(domain => originHost.includes(domain))) {
      gateway = "braintree";  // Default for testing
      log("Using default gateway for test domain:", gateway);
    }
    
    // If still no gateway, reject the request
    if (!gateway) {
      log("No gateway specified");
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "invalid_request", 
            message: "gateway is required"
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

      // Convert allowed hosts to a normalized set
      const allowedHosts = new Set<string>(
        (allowedHostsData ?? [])
          .map((h: string) => {
            const host = hostFromOrigin(h);
            log("Normalized host:", h, "->", host);
            return host;
          })
          .filter((h): h is string => !!h)
      );

      // More lenient matching for development
      const isAllowed = originHost && (
        allowedHosts.has(originHost) || 
        Array.from(allowedHosts).some(h => originHost?.includes(h) || h?.includes(originHost))
      );
      
      log("Origin validation result:", {
        originHost,
        allowedHosts: Array.from(allowedHosts),
        isAllowed
      });

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

    // Query gateway credentials
    log("Querying gateway credentials from v_public_store:", { storeId, gateway });

    const { data, error } = await supabase
      .from("v_public_store")
      .select("publishable_key, tokenization_key, api_login_id")
      .eq("store_id", storeId)
      .eq("active_payment_gateway", gateway)
      .single();

    if (error) {
      log("Query error:", error);
      return withCors(
        new Response(
          JSON.stringify({ 
            error: "database_error", 
            message: error.message 
          }), 
          { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
          }
        ),
        origin
      );
    }

    // Prepare response data
    const responseData = {
      publishable_key: data?.publishable_key || null,
      tokenization_key: data?.tokenization_key || null,
      api_login_id: data?.api_login_id || null
    };
    
    log("Response data:", {
      ...responseData,
      publishable_key: responseData.publishable_key ? "[MASKED]" : null,
      tokenization_key: responseData.tokenization_key ? "[MASKED]" : null,
      api_login_id: responseData.api_login_id ? "[MASKED]" : null
    });

    return withCors(
      new Response(
        JSON.stringify(responseData), 
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