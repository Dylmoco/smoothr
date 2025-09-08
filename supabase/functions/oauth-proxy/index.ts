// oauth-proxy/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const enc = new TextEncoder();

// Base64URL encoding function
function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? enc.encode(input) : input;
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// HMAC sign function
async function signState(payload: Record<string, any>): Promise<string> {
  const secret = Deno.env.get("HMAC_SECRET") || "";
  const body = JSON.stringify(payload);
  const bodyB64 = base64url(body);
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(bodyB64));
  const sigB64 = base64url(new Uint8Array(sig));
  return `${bodyB64}.${sigB64}`;
}

// HMAC verify function
async function verifyState(
  token: string,
): Promise<{ ok: boolean; payload?: any }> {
  try {
    const [bodyB64, sigB64] = token.split(".");
    if (!bodyB64 || !sigB64) return { ok: false };
    const secret = Deno.env.get("HMAC_SECRET") || "";
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      enc.encode(bodyB64),
    );
    if (!ok) return { ok: false };
    const json = atob(bodyB64.replace(/-/g, "+").replace(/_/g, "/"));
    return { ok: true, payload: JSON.parse(json) };
  } catch {
    return { ok: false };
  }
}

/* ------------------------------------------------------------------ *\
 * Utilities
 * ------------------------------------------------------------------ */
function nowSec() {
  return Math.floor(Date.now() / 1000);
}
function randId(n = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return base64url(bytes);
}

/* ---------------------- CORS helpers with COOP/COEP ---------------------- */
function allowCors(req: Request, resp: Response): Response {
  const origin = req.headers.get("origin");
  if (!origin) return resp;

  // clone while preserving everything
  const out = new Response(resp.body, resp);
  const h = out.headers;

  // append/override only the CORS bits
  h.set("access-control-allow-origin", origin);
  h.set("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
  h.set(
    "access-control-allow-headers",
    "Content-Type, Authorization, X-Client-Info",
  );
  h.set("access-control-allow-credentials", "true");
  h.append("vary", "Origin");

  // if HTML, add isolation headers only (do NOT touch content-type or CSP)
  const ct = h.get("content-type") || "";
  if (ct.includes("text/html")) {
    h.set("cross-origin-opener-policy", "same-origin-allow-popups");
    h.set("cross-origin-embedder-policy", "unsafe-none");
  }
  return out;
}

function handleCorsPreflightRequest(req: Request) {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS" && origin) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Client-Info",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
        "Cache-Control": "no-store",
        "Vary": "Origin",
      },
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
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    },
  );

// Admin client (service role) to call SECURITY DEFINER RPCs & tables
const adminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  );

/* ---------------------- Types ---------------------- */
interface StatePayload {
  store_id: string;
  redirect_to: string;
  supabase_base: string;
  nonce: string;
  iat: number;
}

/* ---------------------- Authorize (uses RPC) ---------------------- */
async function handleAuthorize(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const storeId = url.searchParams.get("store_id");
  const redirectTo = url.searchParams.get("redirect_to");
  const origin = req.headers.get("origin");
  const debug = url.searchParams.has("debug");

  console.log(
    `Authorize request - store_id=${storeId} origin=${origin} redirect_to=${redirectTo}`,
  );

  if (!storeId || !redirectTo) {
    return new Response(
      JSON.stringify({
        error: "Missing required parameters: store_id and redirect_to",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
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
      return new Response(
        JSON.stringify({
          error: "Domain validation error",
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (debug) console.log("Domain validation result:", data);

    if (!data?.is_valid) {
      return new Response(
        JSON.stringify({
          error: "Domain validation failed",
          details: data?.messages ?? [],
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }
  } catch (e) {
    console.error("RPC call failed:", e);
    return new Response(JSON.stringify({ error: "Validation system error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  const payload: StatePayload = {
    store_id: storeId!,
    redirect_to: `${origin}/auth/callback`,
    supabase_base: "https://lpuqrzvokroazwlricgn.supabase.co",
    nonce: randId(12),
    iat: nowSec(),
  };
  const state = await signState(payload);

  // Get provider URL (no browser redirect)
  const supabase = supabaseClient(req);
  const { data: authData, error: authError } = await supabase.auth
    .signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://sdk.smoothr.io/oauth/callback",
        skipBrowserRedirect: true,
        queryParams: { access_type: "offline", prompt: "consent" },
        state,
      },
    });

  if (authError) {
    console.error("OAuth error:", authError);
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(JSON.stringify({ url: authData?.url }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

/* ---------------------- Callback Store (POST) ---------------------- */
async function handleCallbackStore(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const {
    state: stateRaw,
    otc,
    access_token,
    refresh_token,
    expires_in,
  } = body || {};

  let state: StatePayload;
  try {
    const { ok, payload } = await verifyState(stateRaw);
    if (!ok) throw new Error("invalid state");
    state = payload as StatePayload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_state" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!otc || !access_token || !refresh_token) {
    return new Response(JSON.stringify({ error: "missing_tokens_or_otc" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const admin = adminClient();
  const ttl = Number(expires_in) || 3600;
  const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
  const { error } = await admin.from("oauth_one_time_codes").insert({
    code: otc,
    store_id: state.store_id,
    data: { access_token, refresh_token, expires_in: ttl } as any,
    expires_at,
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: "otc_persist_failed", details: error.message }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  return new Response(null, { status: 204 });
}

/* ---------------------- Exchange (redeem OTC) ---------------------- */
async function handleExchange(req: Request): Promise<Response> {
  const { otc, store_id } = await req.json().catch(() => ({}));
  if (!otc || !store_id) {
    return new Response(JSON.stringify({ error: "missing_params" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const admin = adminClient();
  const { data, error } = await admin
    .from("oauth_one_time_codes")
    .delete()
    .eq("code", otc)
    .eq("store_id", store_id)
    .gt("expires_at", new Date().toISOString())
    .is("used_at", null)
    .select("data")
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "invalid_or_used_otc" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data.data), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

/* ---------------------- Main router ---------------------- */
Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/oauth-proxy/, "");

  let res: Response;
  if (path === "/authorize" || path === "/") res = await handleAuthorize(req);
  else if (path === "/callback/store" && req.method === "POST") {
    res = await handleCallbackStore(req);
  } else if (path === "/exchange" && req.method === "POST") {
    res = await handleExchange(req);
  } else {
    res = new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  return allowCors(req, res);
});
