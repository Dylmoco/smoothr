// oauth-proxy.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

/* ------------------------------------------------------------------ *
 * Utilities: crypto, base64url, time
 * ------------------------------------------------------------------ */
const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlStr(s: string) {
  return b64url(enc.encode(s));
}
async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
async function hmacSign(secret: string, msg: string) {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}
async function hmacVerify(secret: string, msg: string, sigB64: string) {
  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
    enc.encode(msg)
  );
  return ok;
}
function nowSec() { return Math.floor(Date.now()/1000); }
function randId(n=24) {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return b64url(bytes);
}

/* ---------------------- CORS helpers ---------------------- */
function allowCors(req: Request, resp: Response): Response {
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
function handleCorsPreflightRequest(req: Request) {
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

/* ---------------------- Supabase clients ---------------------- */
// Browser-facing client (anon key) for signInWithOAuth (skip redirect -> get provider URL)
const supabaseClient = (req: Request) =>
  createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_ANON_KEY") || "",
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
  );

// Admin client (service role) to call SECURITY DEFINER RPCs & tables
const adminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

/* ---------------------- State helpers (HMAC-signed) ---------------------- */
type StatePayload = {
  store_id: string;
  redirect_to: string;
  nonce: string;
  iat: number; // issued at (sec)
  exp: number; // expires at (sec)
};

async function signState(payload: StatePayload): Promise<string> {
  const secret = Deno.env.get("HMAC_SECRET") || "";
  const body = JSON.stringify(payload);
  const sig = await hmacSign(secret, body);
  // compact: base64url(json).base64url(sig)
  return `${b64urlStr(body)}.${sig}`;
}

async function verifyState(token: string): Promise<StatePayload | null> {
  try {
    const [b64body, sig] = token.split(".");
    if (!b64body || !sig) return null;
    const json = atob(b64body.replace(/-/g, "+").replace(/_/g, "/"));
    const ok = await hmacVerify(Deno.env.get("HMAC_SECRET") || "", json, sig);
    if (!ok) return null;
    const payload = JSON.parse(json) as StatePayload;
    if (typeof payload?.exp !== "number" || nowSec() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------------------- Authorize (uses RPC) ---------------------- */
async function handleAuthorize(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const storeId = url.searchParams.get("store_id");
  const redirectTo = url.searchParams.get("redirect_to");
  const origin = req.headers.get("origin");
  const debug = url.searchParams.has("debug");

  console.log(`Authorize request - store_id=${storeId} origin=${origin} redirect_to=${redirectTo}`);

  if (!storeId || !redirectTo) {
    return new Response(JSON.stringify({ error: "Missing required parameters: store_id and redirect_to" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate origin/redirect via DB RPC (global + per-store + legacy array)
  try {
    const { data, error } = await adminClient().rpc("validate_oauth_domains", {
      p_origin: origin || "",
      p_redirect: redirectTo,
      p_store_id: storeId,
    });

    if (error) {
      console.error("validate_oauth_domains RPC error:", error);
      return new Response(JSON.stringify({ error: "Domain validation error", details: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (debug) console.log("Domain validation result:", data);

    if (!data?.is_valid) {
      return new Response(
        JSON.stringify({ error: "Domain validation failed", details: data?.messages ?? [] }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("RPC call failed:", e);
    return new Response(JSON.stringify({ error: "Validation system error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const iat = nowSec();
  const payload: StatePayload = {
    store_id: storeId!,
    redirect_to: redirectTo!,
    nonce: randId(12),
    iat,
    exp: iat + 10 * 60, // 10 minutes
  };
  const state = await signState(payload);

  // Get provider URL (no browser redirect)
  const supabase = supabaseClient(req);
  const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${Deno.env.get("SUPABASE_URL")}/functions/v1/oauth-proxy/callback`,
      skipBrowserRedirect: true,
      queryParams: { access_type: "offline", prompt: "consent" },
      state,
    },
  });

  if (authError) {
    console.error("OAuth error:", authError);
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ url: authData?.url }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/* ---------------------- OTC helpers ---------------------- */
type Tokens = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  provider_token?: string;
  provider_refresh_token?: string;
};

async function createOTC(storeId: string, tokens: Tokens, ttlSec = 5 * 60) {
  const supa = adminClient();
  const code = randId(20);
  const expires_at = new Date(Date.now() + ttlSec * 1000).toISOString();
  const { error } = await supa
    .from("oauth_one_time_codes")
    .insert({
      code,
      store_id: storeId,
      data: tokens as any,
      expires_at,
    });
  if (error) throw error;
  return code;
}

async function redeemOTC(code: string) {
  const supa = adminClient();
  // fetch row
  const { data, error } = await supa
    .from("oauth_one_time_codes")
    .select("code, data, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Invalid code");
  if (data.used_at) throw new Error("Code already used");
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error("Code expired");

  const { error: upErr } = await supa
    .from("oauth_one_time_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code", code);
  if (upErr) throw upErr;
  return data.data as Tokens;
}

/* ---------------------- Callback & Exchange ---------------------- */
// We return a tiny HTML page that runs in the BROWSER:
// - parses location.hash for tokens & state
// - POSTs to /exchange?action=init to create an OTC
// - postMessage({ type: 'SUPABASE_AUTH_COMPLETE', otc }) to the opener
// - window.close()
async function handleCallback(_req: Request): Promise<Response> {
  const html = `<!doctype html>
<html>
  <meta charset="utf-8" />
  <title>Authenticating…</title>
  <script>
    (async () => {
      try {
        // Parse hash params
        const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
        const state = hash.get("state");
        const tokens = {};
        for (const [k, v] of hash.entries()) {
          if (k !== "state") tokens[k] = v;
        }
        // Create OTC via init
        const resp = await fetch("./exchange?action=init", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state, tokens })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || "Init failed");
        const { otc, targetOrigin } = json;
        // Post OTC to opener (restricted by targetOrigin)
        if (window.opener && typeof window.opener.postMessage === "function") {
          window.opener.postMessage({ type: "SUPABASE_AUTH_COMPLETE", otc }, targetOrigin || "*");
        }
      } catch (e) {
        console.error("callback error:", e);
      } finally {
        // Always try to close (opener will show 'cancelled' if nothing arrived)
        window.close();
      }
    })();
  </script>
  <body style="background:#000;color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh;">
    <div>Completing sign-in… you can close this window.</div>
  </body>
</html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
}

async function handleExchange(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "redeem";
  try {
    if (action === "init") {
      // Called by popup page JS with { state, tokens }
      const { state, tokens } = await req.json();
      if (!state || !tokens) {
        return new Response(JSON.stringify({ error: "Missing state or tokens" }), {
          status: 400, headers: { "Content-Type": "application/json" }
        });
      }
      const payload = await verifyState(state);
      if (!payload) {
        return new Response(JSON.stringify({ error: "Invalid state" }), {
          status: 400, headers: { "Content-Type": "application/json" }
        });
      }
      // Create OTC bound to store
      const code = await createOTC(payload.store_id, tokens);
      // Post back with targetOrigin = opener (the storefront) derived from redirect_to
      const targetOrigin = new URL(payload.redirect_to).origin;
      return new Response(JSON.stringify({ otc: code, targetOrigin }), {
        status: 200, headers: { "Content-Type": "application/json" }
      });
    }
    // Default: redeem path (called by opener)
    const body = await req.json().catch(() => ({}));
    const { otc } = body;
    if (!otc) {
      return new Response(JSON.stringify({ error: "Missing otc" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }
    const tokens = await redeemOTC(otc);
    return new Response(JSON.stringify(tokens), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    console.error("exchange error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Exchange failed" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }
}

/* ---------------------- Main router ---------------------- */
Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/oauth-proxy/, "");

  let res: Response;
  if (path === "/authorize" || path === "/") res = await handleAuthorize(req);
  else if (path === "/callback") res = await handleCallback(req);
  else if (path === "/exchange") res = await handleExchange(req);
  else
    res = new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  return allowCors(req, res);
});

