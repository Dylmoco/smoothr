// shared_cors.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const defaultOptions = {
  allowedOrigins: [],
  validateAgainstStores: true,
  allowedMethods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Client-Info"
  ],
  maxAge: 86400,
  defaultOrigin: ""
};
// Function to validate if the origin belongs to a registered store
async function isValidStoreOrigin(origin, storeId) {
  if (!origin) return false;
  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    // Extract domain from origin
    const originDomain = new URL(origin).hostname;
    let query = supabaseAdmin.from('stores').select('id, domains');
    // If store_id is provided, restrict the check to that specific store
    if (storeId) {
      query = query.eq('id', storeId);
    }
    const { data: stores, error } = await query;
    if (error || !stores || stores.length === 0) {
      console.error("Error validating store origin:", error);
      return false;
    }
    // Check if any store's domains array contains the origin domain
    return stores.some((store)=>{
      const domains = store.domains || [];
      return domains.some((domain)=>{
        // Direct match
        if (domain === originDomain) return true;
        // Wildcard match (*.example.com)
        if (domain.startsWith('*.')) {
          const wildcardBase = domain.substring(2);
          return originDomain.endsWith(wildcardBase) && originDomain.split('.').length > wildcardBase.split('.').length;
        }
        return false;
      });
    });
  } catch (error) {
    console.error("Error in store origin validation:", error);
    return false;
  }
}
// Main CORS middleware
export async function applyCors(req, options, storeId) {
  const mergedOptions = {
    ...defaultOptions,
    ...options
  };
  const origin = req.headers.get("origin");
  // If no origin, this isn't a CORS request
  if (!origin) {
    return null;
  }
  let isAllowed = false;
  // First check explicit allowed origins
  if (mergedOptions.allowedOrigins?.length) {
    isAllowed = mergedOptions.allowedOrigins.includes(origin);
  }
  // If not explicitly allowed, check against store domains if validateAgainstStores is true
  if (!isAllowed && mergedOptions.validateAgainstStores) {
    isAllowed = await isValidStoreOrigin(origin, storeId);
  }
  // If not allowed and no default origin, return null so the request can be handled
  // (likely will be rejected by the browser due to CORS)
  if (!isAllowed && !mergedOptions.defaultOrigin) {
    console.warn(`Origin ${origin} not allowed and no default origin`);
    return null;
  }
  // Determine which origin to use in the response
  const responseOrigin = isAllowed ? origin : mergedOptions.defaultOrigin;
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": responseOrigin,
        "Access-Control-Allow-Methods": mergedOptions.allowedMethods.join(", "),
        "Access-Control-Allow-Headers": mergedOptions.allowedHeaders.join(", "),
        "Access-Control-Max-Age": mergedOptions.maxAge.toString(),
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin"
      }
    });
  }
  // For non-OPTIONS requests, return null to continue processing
  // but store allowed origin info to be used later
  req.headers.set("x-cors-allowed-origin", responseOrigin);
  return null;
}
// Helper to apply CORS headers to any response
export function applyCorsHeaders(response, req) {
  const allowedOrigin = req.headers.get("x-cors-allowed-origin");
  if (allowedOrigin) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
    newHeaders.set("Access-Control-Allow-Credentials", "true");
    newHeaders.set("Vary", "Origin");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
  return response;
}