// oauth-proxy/index.ts - main file with updated callback handler
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

  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Client-Info",
  );
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
    headers,
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
    redirect_to: redirectTo!,
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
        redirectTo: `${
          Deno.env.get("SUPABASE_URL")
        }/functions/v1/oauth-proxy/callback`,
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

/* ---------------------- Callback (HTML) ---------------------- */
async function handleCallbackGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const stateRaw = url.searchParams.get("state") || "";
  let openerOrigin = "*";
  try {
    const { ok, payload } = await verifyState(stateRaw);
    if (ok && payload?.redirect_to) {
      openerOrigin = new URL(payload.redirect_to).origin;
    }
  } catch {
    /* ignore - fall back to '*' */
  }

  const html = `<!doctype html><html><head>
  <meta charset="utf-8" />
  <title>Authenticating…</title>
  <script>
  (async () => {
    function b64url(bytes) {
      return btoa(String.fromCharCode(...bytes))
        .replace(/\\+/g, '-').replace(/\\/g, '_').replace(/=+$/g, '');
    }

    try {
      const url = new URL(location.href);
      const hash = new URLSearchParams(url.hash.slice(1));
      const state = url.searchParams.get('state') || '';
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      const expires_in = hash.get('expires_in');

      console.log("Authentication callback received, preparing to message parent window");

      // Generate random bytes for one-time code
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const otc = b64url(bytes);

      // Post data back to parent window first
      try {
        if (window.opener) {
          console.log("Found opener window, attempting to post message");
          // Try sending message to opener with wildcard origin first for compatibility
          window.opener.postMessage({ 
            type: 'SUPABASE_AUTH_COMPLETE', 
            otc,
            access_token,
            state
          }, '*');

          // Also try sending with specific origin if available from state
          try {
            const stateData = JSON.parse(atob(state.split('.')[0]));
            if (stateData?.redirect_to) {
              const targetOrigin = new URL(stateData.redirect_to).origin;
              window.opener.postMessage({ 
                type: 'SUPABASE_AUTH_COMPLETE', 
                otc,
                access_token,
                state
              }, targetOrigin);
            }
          } catch (e) {
            console.warn("Failed to parse state or send targeted message:", e);
          }
        } else {
          console.warn("No opener window found");
        }
      } catch (e) {
        console.error("Error posting message to opener:", e);
        document.getElementById('error').textContent = 
          "Error communicating with parent window: " + e.message;
      }

      // Store the auth data
      try {
        await fetch('/functions/v1/oauth-proxy/callback/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            state, 
            otc, 
            access_token, 
            refresh_token, 
            expires_in 
          })
        });
      } catch (storeError) {
        console.error("Failed to store auth data:", storeError);
      }

      // Add a delay before closing to ensure message is delivered
      document.getElementById('status').textContent = "Authentication complete. This window will close automatically...";

      // Use a combination of approaches to attempt closing
      setTimeout(() => {
        try {
          // First try normal close
          window.close();

          // If we're still here after 100ms, try alternative approaches
          setTimeout(() => {
            if (!window.closed) {
              // Try self-close method
              self.close();

              // Finally, if all else fails, instruct user to close manually
              setTimeout(() => {
                if (!window.closed) {
                  document.getElementById('status').textContent = 
                    "Authentication complete. Please close this window manually.";
                  document.getElementById('closeButton').style.display = "block";
                }
              }, 300);
            }
          }, 100);
        } catch (closeErr) {
          console.error("Error closing window:", closeErr);
          document.getElementById('status').textContent = 
            "Authentication complete. Please close this window manually.";
          document.getElementById('closeButton').style.display = "block";
        }
      }, 800);

    } catch (e) {
      console.error('Callback error:', e);
      document.getElementById('error').textContent = e.message || "Unknown error occurred";
      document.getElementById('closeButton').style.display = "block";
    }
  })();
  </script>
  </head>
  <body style="background:#111;color:#fff;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;">
    <div>
      <h2 style="margin-top:0;">Authentication</h2>
      <p id="status">Completing sign-in...</p>
      <p id="error" style="color:#ff6b6b;"></p>
      <button id="closeButton" style="display:none;margin-top:20px;padding:10px 16px;background:#3d5afe;color:white;border:none;border-radius:4px;cursor:pointer;" onclick="window.close()">Close Window</button>
    </div>
  </body></html>`;

  const headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "content-security-policy":
      "default-src 'none'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'unsafe-inline'; " +
      "connect-src 'self'; " +
      "img-src 'self' data:; " +
      "base-uri 'none'; " +
      "frame-ancestors 'none';",
    "x-frame-options": "DENY",
    "cross-origin-opener-policy": "same-origin-allow-popups",
    "cross-origin-embedder-policy": "unsafe-none",
    "access-control-allow-origin": openerOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    "access-control-allow-credentials": "true",
    "vary": "Origin",
  });
  return new Response(html, { status: 200, headers });
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
  else if (path === "/callback" && req.method === "GET") {
    res = await handleCallbackGet(req);
  } else if (path === "/callback/store" && req.method === "POST") {
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
