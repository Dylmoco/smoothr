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

async function hashState(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(raw));
  return base64url(new Uint8Array(digest));
}

async function decodeState(
  token: string,
  maxAgeSec = 600,
): Promise<{ payload: StatePayload; hash: string }> {
  const [payloadB64] = token.split(".");
  const { ok, payload } = await verifyState(token);
  if (!ok) throw new Error("invalid_state");
  if (typeof payload.iat !== "number" || nowSec() - payload.iat > maxAgeSec) {
    throw new Error("stale_state");
  }
  return { payload, hash: await hashState(payloadB64) };
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

  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
  if (!GOOGLE_CLIENT_ID) {
    return new Response(JSON.stringify({ error: "Missing GOOGLE_CLIENT_ID" }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const base = "https://accounts.google.com/o/oauth2/v2/auth";
  const redirect_uri = "https://sdk.smoothr.io/oauth/callback";
  const scope = "openid email profile";
  const ordered =
    `response_type=code&client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
  const providerUrl = `${base}?${ordered}`;

  return new Response(JSON.stringify({ url: providerUrl }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

/* ---------------------- Callback Store (POST) ---------------------- */
async function handleCallbackStore(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { state: stateRaw, otc, code } = body || {};

  if (!stateRaw || !otc || !code) {
    console.info(JSON.stringify({ event: "store_rejected", reason: "missing_params" }));
    return new Response(JSON.stringify({ error: "missing_params" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let decoded: { payload: StatePayload; hash: string };
  try {
    decoded = await decodeState(stateRaw);
  } catch (e: any) {
    const err = e?.message === "stale_state" ? "stale_state" : "invalid_state";
    console.info(JSON.stringify({ event: "store_rejected", reason: err }));
    return new Response(JSON.stringify({ error: err }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const store_id = decoded.payload.store_id;
  const state_hash = decoded.hash;

  console.info(
    JSON.stringify({ event: "store_received", code, otc, store_id, state_hash }),
  );

  const admin = adminClient();
  const { data: existing, error: readErr } = await admin
    .from("oauth_one_time_codes")
    .select("store_id, data, used_at")
    .eq("code", code)
    .single();

  if (readErr && readErr.code !== "PGRST116") {
    // unexpected read error
    console.info(JSON.stringify({ event: "store_rejected", reason: "read_failed", store_id }));
    return new Response(JSON.stringify({ error: "read_failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (existing) {
    if (existing.used_at) {
      console.info(JSON.stringify({ event: "store_rejected", reason: "already_used", store_id }));
      return new Response(JSON.stringify({ error: "already_used" }), {
        status: 409,
        headers: { "content-type": "application/json" },
      });
    }
    if (existing.store_id !== store_id) {
      console.info(JSON.stringify({ event: "store_rejected", reason: "store_mismatch", store_id }));
      return new Response(JSON.stringify({ error: "store_mismatch" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const data = existing.data || {};
    if (!data.otc) data.otc = otc;
    data.state_hash = state_hash;
    await admin
      .from("oauth_one_time_codes")
      .update({ data })
      .eq("code", code);
    console.info(JSON.stringify({ event: "store_saved", code, otc, store_id, state_hash }));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  }

  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const insert = await admin.from("oauth_one_time_codes").insert({
    code,
    store_id,
    data: { otc, state_hash },
    expires_at,
    used_at: null,
  });
  if (insert.error) {
    console.info(JSON.stringify({ event: "store_rejected", reason: "persist_failed", store_id }));
    return new Response(
      JSON.stringify({ error: "persist_failed", details: insert.error.message }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  console.info(JSON.stringify({ event: "store_saved", code, otc, store_id, state_hash }));
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

/* ---------------------- Exchange (redeem OTC) ---------------------- */
async function handleExchange(req: Request): Promise<Response> {
  const { otc, state: stateRaw } = await req.json().catch(() => ({}));
  if (!otc || !stateRaw) {
    return new Response(JSON.stringify({ error: "missing_params" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let decoded: { payload: StatePayload; hash: string };
  try {
    decoded = await decodeState(stateRaw);
  } catch (e: any) {
    const err = e?.message === "stale_state" ? "stale_state" : "invalid_state";
    console.info(JSON.stringify({ event: "exchange_error", reason: err }));
    return new Response(JSON.stringify({ error: err }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const admin = adminClient();
  const store_id = decoded.payload.store_id;
  const state_hash = decoded.hash;

  const { data: row, error } = await admin
    .from("oauth_one_time_codes")
    .select("code, store_id, data, used_at, expires_at")
    .eq("data->>otc", otc)
    .single();

  if (error || !row || row.store_id !== store_id || (!row.used_at && new Date(row.expires_at) < new Date())) {
    console.info(JSON.stringify({ event: "exchange_pending", otc, store_id }));
    return new Response(JSON.stringify({ retry: true, reason: "pending" }), {
      status: 202,
      headers: { "content-type": "application/json" },
    });
  }

  const stored = (row.data || {}) as any;
  if (stored.state_hash && stored.state_hash !== state_hash) {
    console.info(JSON.stringify({ event: "exchange_error", reason: "state_mismatch", otc, store_id }));
    return new Response(JSON.stringify({ error: "state_mismatch" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (row.used_at && stored.session_cache) {
    console.info(JSON.stringify({ event: "exchange_cached", otc, store_id }));
    return new Response(JSON.stringify(stored.session_cache), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  }

  console.info(JSON.stringify({ event: "exchange_started", otc, store_id }));

  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
  const redirect_uri = "https://sdk.smoothr.io/oauth/callback";

  const params = new URLSearchParams();
  params.set("code", row.code);
  params.set("client_id", GOOGLE_CLIENT_ID);
  params.set("client_secret", GOOGLE_CLIENT_SECRET);
  params.set("redirect_uri", redirect_uri);
  params.set("grant_type", "authorization_code");

  let tokenJson: any;
  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    tokenJson = await resp.json();
    if (!resp.ok) throw new Error(tokenJson.error || "token_exchange_failed");
  } catch (e) {
    console.info(JSON.stringify({ event: "exchange_error", reason: "google_redeem_failed", otc, store_id }));
    return new Response(
      JSON.stringify({ error: "google_redeem_failed", details: `${e}` }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(supabaseUrl, anonKey);
  const { data: sess, error: se } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: tokenJson.id_token,
    access_token: tokenJson.access_token,
  });
  if (se || !sess?.session) {
    console.info(JSON.stringify({ event: "exchange_error", reason: "supabase_session_failed", otc, store_id }));
    return new Response(
      JSON.stringify({ error: "supabase_session_failed", details: se?.message }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const session_cache = {
    session: {
      access_token: sess.session.access_token,
      refresh_token: sess.session.refresh_token,
      expires_in: sess.session.expires_in,
      token_type: "bearer",
    },
    user: sess.session.user,
  };

  const update = await admin
    .from("oauth_one_time_codes")
    .update({
      used_at: new Date().toISOString(),
      data: { ...stored, session_cache, state_hash },
    })
    .eq("code", row.code);

  if (update.error) {
    console.info(JSON.stringify({ event: "exchange_error", reason: "update_failed", otc, store_id }));
    return new Response(
      JSON.stringify({ error: "update_failed", details: update.error.message }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  console.info(JSON.stringify({ event: "exchange_success", otc, store_id, user_id: sess.session.user.id }));

  return new Response(JSON.stringify(session_cache), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
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
