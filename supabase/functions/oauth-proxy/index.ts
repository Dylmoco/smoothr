// oauth-proxy/index.ts - main file with updated callback handler
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const enc = new TextEncoder();
// Base64URL encoding function
function base64url(input) {
  const bytes = typeof input === "string" ? enc.encode(input) : input;
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
// HMAC sign function
async function signState(payload) {
  const secret = Deno.env.get("HMAC_SECRET") || "";
  const body = JSON.stringify(payload);
  const bodyB64 = base64url(body);
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, [
    "sign"
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(bodyB64));
  const sigB64 = base64url(new Uint8Array(sig));
  return `${bodyB64}.${sigB64}`;
}
// HMAC verify function
async function verifyState(token) {
  try {
    const [bodyB64, sigB64] = token.split(".");
    if (!bodyB64 || !sigB64) return {
      ok: false
    };
    const secret = Deno.env.get("HMAC_SECRET") || "";
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
      name: "HMAC",
      hash: "SHA-256"
    }, false, [
      "verify"
    ]);
    const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), (c)=>c.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(bodyB64));
    if (!ok) return {
      ok: false
    };
    const json = atob(bodyB64.replace(/-/g, "+").replace(/_/g, "/"));
    return {
      ok: true,
      payload: JSON.parse(json)
    };
  } catch  {
    return {
      ok: false
    };
  }
}
/* ------------------------------------------------------------------ *\
 * Utilities
 * ------------------------------------------------------------------ */ function nowSec() {
  return Math.floor(Date.now() / 1000);
}
function randId(n = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return base64url(bytes);
}
/* ---------------------- CORS helpers with COOP/COEP ---------------------- */ function allowCors(req, resp) {
  const origin = req.headers.get("origin");
  if (!origin) return resp;
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Info");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");
  // Add COOP/COEP headers to make window.close and postMessage work
  if (resp.headers.get("Content-Type")?.includes("text/html")) {
    headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
  }
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
// Admin client (service role) to call SECURITY DEFINER RPCs & tables
const adminClient = ()=>createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
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
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  }
  // Validate origin/redirect via DB RPC (global + per-store + legacy array)
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
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
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
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
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
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  }
  const payload = {
    store_id: storeId,
    redirect_to: redirectTo,
    nonce: randId(12),
    iat: nowSec()
  };
  const state = await signState(payload);
  // Get provider URL (no browser redirect)
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
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
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
/* ---------------------- Callback (HTML) ---------------------- */ async function handleCallbackGet(req) {
  const url = new URL(req.url);
  const stateRaw = url.searchParams.get("state") || "";
  let openerOrigin = "*";
  try {
    const { ok, payload } = await verifyState(stateRaw);
    if (ok && payload?.redirect_to) {
      openerOrigin = new URL(payload.redirect_to).origin;
    }
  } catch  {
  /* ignore - fall back to '*' */ }
  const html = `<!doctype html><html><meta charset="utf-8" />
<title>Authenticating…</title>
<script>
(async () => {
  function b64url(bytes) {
    return btoa(String.fromCharCode(...bytes))
      .replace(/\\+/g,'-').replace(/\\/g,'_').replace(/=+$/,'');
  }
  try {
    const url = new URL(location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const state = url.searchParams.get('state') || '';
    const access_token = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');
    const expires_in = hash.get('expires_in');

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const otc = b64url(bytes);

    await fetch('/functions/v1/oauth-proxy/callback/store', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state, otc, access_token, refresh_token, expires_in })
    });

    window.opener?.postMessage({ type: 'SUPABASE_AUTH_COMPLETE', otc }, ${JSON.stringify(openerOrigin)});
    
    // Add a delay to ensure message is delivered before closing
    setTimeout(() => {
      window.close();
    }, 300);
  } catch (e) {
    console.error('callback error:', e);
    document.getElementById('error').textContent = e.message;
  }
})();
</script>
<body style="background:#000;color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh;">
  <div>
    <p>Completing sign-in… you can close this window.</p>
    <p id="error" style="color:red;"></p>
  </div>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none"
    }
  });
}
/* ---------------------- Callback Store (POST) ---------------------- */ async function handleCallbackStore(req) {
  const body = await req.json().catch(()=>({}));
  const { state: stateRaw, otc, access_token, refresh_token, expires_in } = body || {};
  let state;
  try {
    const { ok, payload } = await verifyState(stateRaw);
    if (!ok) throw new Error("invalid state");
    state = payload;
  } catch  {
    return new Response(JSON.stringify({
      error: "invalid_state"
    }), {
      status: 400,
      headers: {
        "content-type": "application/json"
      }
    });
  }
  if (!otc || !access_token || !refresh_token) {
    return new Response(JSON.stringify({
      error: "missing_tokens_or_otc"
    }), {
      status: 400,
      headers: {
        "content-type": "application/json"
      }
    });
  }
  const admin = adminClient();
  const ttl = Number(expires_in) || 3600;
  const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
  const { error } = await admin.from("oauth_one_time_codes").insert({
    code: otc,
    store_id: state.store_id,
    data: {
      access_token,
      refresh_token,
      expires_in: ttl
    },
    expires_at
  });
  if (error) {
    return new Response(JSON.stringify({
      error: "otc_persist_failed",
      details: error.message
    }), {
      status: 500,
      headers: {
        "content-type": "application/json"
      }
    });
  }
  return new Response(null, {
    status: 204
  });
}
/* ---------------------- Exchange (redeem OTC) ---------------------- */ async function handleExchange(req) {
  const { otc, store_id } = await req.json().catch(()=>({}));
  if (!otc || !store_id) {
    return new Response(JSON.stringify({
      error: "missing_params"
    }), {
      status: 400,
      headers: {
        "content-type": "application/json"
      }
    });
  }
  const admin = adminClient();
  const { data, error } = await admin.from("oauth_one_time_codes").delete().eq("code", otc).eq("store_id", store_id).gt("expires_at", new Date().toISOString()).is("used_at", null).select("data").single();
  if (error || !data) {
    return new Response(JSON.stringify({
      error: "invalid_or_used_otc"
    }), {
      status: 400,
      headers: {
        "content-type": "application/json"
      }
    });
  }
  return new Response(JSON.stringify(data.data), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
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
  else if (path === "/callback" && req.method === "GET") res = await handleCallbackGet(req);
  else if (path === "/callback/store" && req.method === "POST") res = await handleCallbackStore(req);
  else if (path === "/exchange" && req.method === "POST") res = await handleExchange(req);
  else {
    res = new Response(JSON.stringify({
      error: "Not found"
    }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  }
  return allowCors(req, res);
});
