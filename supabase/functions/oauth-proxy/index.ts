// supabase/functions/oauth-proxy/index.ts
// Edge function: OAuth broker for multi-tenant Google sign-in
// - /authorize: validates domains, builds signed state (HMAC), returns provider URL (JSON)
// - /callback : verifies state, posts { code, state, store_id } to opener (targetOrigin = redirect_to origin), closes
//
// CORS: echoes request Origin (with Vary: Origin) on all routes; OPTIONS preflight supported
// JWT: deploy with --no-verify-jwt (browser calls pre-auth)

import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// ---------- Config ----------
const PROJECT_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const HMAC_SECRET = Deno.env.get("HMAC_SECRET") ?? "";

if (!PROJECT_URL || !ANON_KEY || !SERVICE_ROLE || !HMAC_SECRET) {
  console.error("Missing required env (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, HMAC_SECRET)");
}

// Signed state TTL (seconds)
const STATE_TTL = 10 * 60; // 10 minutes

// ---------- CORS helpers ----------
function corsPreflight(req: Request): Response | null {
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
        "Vary": "Origin",
        "Cache-Control": "no-store",
      },
    });
  }
  return null;
}

function withCors(req: Request, resp: Response): Response {
  const origin = req.headers.get("origin");
  if (!origin) return resp;
  const h = new Headers(resp.headers);
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Info");
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Vary", "Origin");
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}

// ---------- Supabase clients ----------
const sbAnon = (req: Request) =>
  createClient(PROJECT_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

const sbService = () => createClient(PROJECT_URL, SERVICE_ROLE);

// ---------- Tiny utils ----------
function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
function encUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
async function hmacHex(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encUtf8(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encUtf8(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}
function safeJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

// ---------- Domain validation via RPC ----------
type ValidationResult = {
  is_valid: boolean;
  origin_valid: boolean;
  redirect_valid: boolean;
  messages: string[];
};

async function validateDomains(origin: string | null, redirectTo: string, storeId: string): Promise<ValidationResult> {
  try {
    const svc = sbService();
    const { data, error } = await svc.rpc("validate_oauth_domains", {
      p_origin: origin ?? "",
      p_redirect: redirectTo,
      p_store_id: storeId,
    });
    if (error) {
      console.error("validate_oauth_domains error:", error);
      return { is_valid: false, origin_valid: false, redirect_valid: false, messages: ["Validation RPC error"] };
    }
    return data as ValidationResult;
  } catch (e) {
    console.error("validateDomains exception:", e);
    return { is_valid: false, origin_valid: false, redirect_valid: false, messages: ["Validation system error"] };
  }
}

// ---------- Signed state (compact "s.h") ----------
type StatePayload = {
  store_id: string;
  redirect_to: string;
  ts: number; // issued-at seconds
  n: string; // nonce
};

async function signState(payload: StatePayload): Promise<string> {
  const s = b64url(encUtf8(JSON.stringify(payload)));
  const h = await hmacHex(s);
  return `${s}.${h}`;
}

async function verifyState(compact: string): Promise<StatePayload | null> {
  const [s, h] = compact.split(".", 2);
  if (!s || !h) return null;
  const expected = await hmacHex(s);
  if (expected !== h) return null;
  try {
    const json = new TextDecoder().decode(Uint8Array.from(atob(s.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0)));
    const obj = JSON.parse(json) as StatePayload;
    if (!obj || !obj.store_id || !obj.redirect_to || !obj.ts || !obj.n) return null;
    if (nowSec() - obj.ts > STATE_TTL) return null; // expired
    return obj;
  } catch {
    return null;
  }
}

// ---------- /authorize ----------
async function handleAuthorize(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const storeId = url.searchParams.get("store_id") ?? "";
  const redirectTo = url.searchParams.get("redirect_to") ?? "";
  const origin = req.headers.get("origin");

  if (!storeId || !redirectTo) {
    return safeJson({ error: "Missing required parameters: store_id and redirect_to" }, 400);
  }

  // Validate origin + redirect_to against DB-driven patterns
  const vr = await validateDomains(origin, redirectTo, storeId);
  if (!vr.is_valid) {
    console.error("Domain validation failed:", vr.messages);
    return safeJson({ error: "Domain validation failed", details: vr.messages }, 403);
  }

  // Build signed state
  const state = await signState({
    store_id: storeId,
    redirect_to: redirectTo,
    ts: nowSec(),
    n: crypto.randomUUID(),
  });

  // Ask Supabase to build provider URL (no redirect here)
  const { data, error } = await sbAnon(req).auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${PROJECT_URL}/functions/v1/oauth-proxy/callback`,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      state,
    },
  });

  if (error) {
    console.error("signInWithOAuth error:", error);
    return safeJson({ error: error.message }, 500);
  }

  // Return JSON containing the provider authorization URL
  return safeJson({ url: data.url }, 200);
}

// ---------- /callback (broker-led; posts message to opener) ----------
function htmlPostMessagePage(targetOrigin: string, payload: Record<string, unknown>): Response {
  const body = `
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Authenticating…</title></head>
<body>
<script>
  (function () {
    try {
      var payload = ${JSON.stringify(payload)};
      var target = ${JSON.stringify(targetOrigin)};
      if (window.opener && typeof window.opener.postMessage === 'function') {
        window.opener.postMessage({ type: 'smoothr:oauth:code', payload: payload }, target);
      }
    } catch (e) { /* noop */ }
    // Close quickly; some browsers require a small delay
    setTimeout(function(){ window.close(); }, 50);
  })();
</script>
</body>
</html>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function handleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  if (!code || !state) {
    return safeJson({ error: "Missing required OAuth parameters" }, 400);
  }

  // Verify signed state
  const decoded = await verifyState(state);
  if (!decoded) {
    return safeJson({ error: "Invalid or expired state" }, 400);
  }

  // Compute strict target origin from redirect_to
  let targetOrigin: string;
  try {
    const u = new URL(decoded.redirect_to);
    targetOrigin = `${u.protocol}//${u.host}`;
  } catch {
    return safeJson({ error: "Bad redirect_to in state" }, 400);
  }

  // Post only the minimal info needed; the opener will complete the client-side exchange
  const payload = {
    code,
    state, // opener may re-verify if desired
    store_id: decoded.store_id,
  };

  return htmlPostMessagePage(targetOrigin, payload);
}

// ---------- Router ----------
Deno.serve(async (req: Request) => {
  // CORS preflight first
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const u = new URL(req.url);
    const path = u.pathname.replace(/^\/oauth-proxy/, "") || "/";

    if (req.method === "GET" && (path === "/" || path === "/authorize")) {
      return withCors(req, await handleAuthorize(req));
    }
    if (req.method === "GET" && path === "/callback") {
      return withCors(req, await handleCallback(req));
    }

    // Not found
    return withCors(req, safeJson({ error: "Not found" }, 404));
  } catch (e) {
    console.error("Unhandled error:", e);
    return withCors(req, safeJson({ error: "Server error" }, 500));
  }
});