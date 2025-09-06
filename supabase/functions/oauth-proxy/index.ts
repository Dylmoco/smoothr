// oauth-proxy.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
/* ---------------------- CORS helpers ---------------------- */ function allowCors(req, resp) {
  const origin = req.headers.get("origin");
  if (!origin) return resp;
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Info");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers
  });
}
function handleCorsPreflightRequest(req) {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS" && origin) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
        "Cache-Control": "no-store",
        "Vary": "Origin"
      }
    });
  }
  return null;
}
/* ---------------------- Supabase clients ---------------------- */ // Browser-facing client (anon key) for signInWithOAuth (skip redirect -> get provider URL)
const supabaseClient = (req)=>createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") || ""
      }
    }
  });
// Admin client (service role) to call SECURITY DEFINER RPCs
const adminClient = ()=>createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
/* ---------------------- State helper (placeholder) ---------------------- */ async function generateSignedState(data) {
  // TODO: replace with HMAC/JWT signing; this is fine for wiring tests
  return JSON.stringify(data);
}
/* ---------------------- Authorize (uses RPC) ---------------------- */ async function handleAuthorize(req) {
  const url = new URL(req.url);
  const storeId = url.searchParams.get("store_id");
  const redirectTo = url.searchParams.get("redirect_to");
  const origin = req.headers.get("origin");
  const debug = url.searchParams.has("debug");
  console.log(`Authorize request - store_id=${storeId} origin=${origin} redirect_to=${redirectTo}`);
  if (!storeId || !redirectTo) {
    return new Response(JSON.stringify({
      error: "Missing required parameters: store_id and redirect_to"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  // Call the DB RPC that applies all your domain logic (global patterns, store domains, legacy array)
  try {
    const { data, error } = await adminClient().rpc("validate_oauth_domains", {
      p_origin: origin || "",
      p_redirect: redirectTo,
      p_store_id: storeId
    });
    if (error) {
      console.error("validate_oauth_domains RPC error:", error);
      return new Response(JSON.stringify({
        error: "Domain validation error",
        details: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (debug) console.log("Domain validation result:", data);
    if (!data?.is_valid) {
      return new Response(JSON.stringify({
        error: "Domain validation failed",
        details: data?.messages ?? []
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  } catch (e) {
    console.error("RPC call failed:", e);
    return new Response(JSON.stringify({
      error: "Validation system error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  // Proceed to get the provider URL
  const state = await generateSignedState({
    store_id: storeId,
    redirect_to: redirectTo
  });
  const supabase = supabaseClient(req);
  const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-proxy/callback`,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      },
      state
    }
  });
  if (authError) {
    console.error("OAuth error:", authError);
    return new Response(JSON.stringify({
      error: authError.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  return new Response(JSON.stringify({
    url: authData?.url
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
/* ---------------------- Callback & Exchange (stubs) ---------------------- */ async function handleCallback(_req) {
  // TODO: verify signed state, create one-time code, postMessage & close popup
  return new Response(JSON.stringify({
    ok: true,
    where: "callback"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
async function handleExchange(_req) {
  // TODO: consume one-time code, set session
  return new Response(JSON.stringify({
    ok: true,
    where: "exchange"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
/* ---------------------- Main router ---------------------- */ Deno.serve(async (req)=>{
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/oauth-proxy/, "");
  let res;
  if (path === "/authorize" || path === "/") res = await handleAuthorize(req);
  else if (path === "/callback") res = await handleCallback(req);
  else if (path === "/exchange") res = await handleExchange(req);
  else res = new Response(JSON.stringify({
    error: "Not found"
  }), {
    status: 404,
    headers: {
      "Content-Type": "application/json"
    }
  });
  return allowCors(req, res);
});
