import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { applyCors, withCors } from "../_shared/cors.ts";

// Match host against domain (supports leading wildcard "*.")
function hostMatches(host: string, domain?: string | null): boolean {
  if (!host || !domain) return false;
  const d = String(domain);
  if (d.startsWith("*.")) {
    const base = d.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }
  return host === d;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET = Deno.env.get("HMAC_SECRET")!;

const supabase = createClient(supabaseUrl, serviceKey);

const FUNCTION_CALLBACK =
  "https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/callback";

const rateMap = new Map<string, { count: number; ts: number }>();
const LIMIT = 100; // requests per minute

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > 60_000) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verify(data: string, sig: string): Promise<boolean> {
  const expected = await hmac(data);
  return expected === sig;
}

function path(url: URL) {
  return url.pathname.replace(/^\/?oauth-proxy/, "") || "/";
}

// Dynamic CORS is applied per-request and validated against store domains
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const storeIdParam = url.searchParams.get("store_id") || undefined;
  const maybeOptions = await applyCors(req, undefined, storeIdParam);
  if (maybeOptions) return maybeOptions;

  const ip = req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  if (!checkRate(ip)) {
    return withCors(req, new Response("Too many requests", { status: 429 }));
  }
  const p = path(url);

  if (p === "/authorize") {
    const storeId = url.searchParams.get("store_id") || "";
    const redirect = url.searchParams.get("redirect_to") || "";
    if (!storeId || !redirect) {
      return withCors(
        req,
        new Response(JSON.stringify({ error: "missing_params" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    const { data: store } = await supabase
      .from("stores")
      .select("store_domain, live_domain, domains")
      .eq("id", storeId)
      .single();
    if (!store) {
      return withCors(
        req,
        new Response(JSON.stringify({ error: "invalid_store" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    let redirectUrl: URL;
    try {
      redirectUrl = new URL(redirect);
    } catch (_) {
      return withCors(
        req,
        new Response(JSON.stringify({ error: "invalid_redirect" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    const redirectHost = redirectUrl.hostname;
    const candidates: string[] = [];
    if (store.store_domain) candidates.push(store.store_domain);
    if (store.live_domain) candidates.push(store.live_domain);
    if (Array.isArray(store.domains)) candidates.push(...store.domains);
    const validRedirect = candidates.some((d) => hostMatches(redirectHost, d));
    if (!validRedirect) {
      return withCors(
        req,
        new Response(JSON.stringify({ error: "invalid_redirect" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    // override allowed origin to redirect origin so CORS ACAO matches
    const hdrs = new Headers(req.headers);
    hdrs.set("x-cors-allowed-origin", redirectUrl.origin);
    const corsReq = new Request(req.url, { method: req.method, headers: hdrs });

    const payload = { sid: storeId, rid: redirect, ts: Date.now() };
    const s = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(
      /\//g,
      "_",
    ).replace(/=+$/, "");
    const h = await hmac(s);
    const expires = new Date(Date.now() + 10 * 60_000).toISOString();

    await supabase.from("auth_state_management").insert({
      state: s,
      hmac: h,
      metadata: payload,
      type: "state",
      expires_at: expires,
    });

    const { data: authData, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: FUNCTION_CALLBACK,
        skipBrowserRedirect: true,
        queryParams: {
          state: s,
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });
    if (error || !authData?.url) {
      return withCors(
        corsReq,
        new Response(
          JSON.stringify({ error: error?.message || "oauth_error" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    }

    return withCors(
      corsReq,
      new Response(JSON.stringify({ url: authData.url }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  if (p === "/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      return withCors(req, new Response("Invalid callback", { status: 400 }));
    }
    const { data: row } = await supabase
      .from("auth_state_management")
      .select("hmac, metadata, used_at")
      .eq("state", state)
      .single();
    if (!row || row.used_at || !(await verify(state, row.hmac))) {
      return withCors(req, new Response("Invalid state", { status: 400 }));
    }
    await supabase
      .from("auth_state_management")
      .update({ used_at: new Date().toISOString() })
      .eq("state", state);
    const { data: sessData, error } = await supabase.auth
      .exchangeCodeForSession({
        authCode: code,
      });
    if (error || !sessData.session) {
      return withCors(req, new Response("Exchange failed", { status: 400 }));
    }
    const otc = crypto.randomUUID();
    await supabase.from("auth_state_management").insert({
      code: otc,
      session: sessData.session,
      metadata: row.metadata,
      type: "exchange",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    let targetOrigin = "";
    try {
      targetOrigin = new URL((row.metadata as any).rid).origin;
    } catch (_) {
      return withCors(
        req,
        new Response("Invalid redirect URL", { status: 400 }),
      );
    }
    const body = `<!DOCTYPE html><script>(function(){const o=${
      JSON.stringify(targetOrigin)
    };const c=${
      JSON.stringify(otc)
    };try{window.opener.postMessage({ type: 'SUPABASE_AUTH_COMPLETE', otc:c }, o);}catch(e){};try{window.close();}catch(e){};setTimeout(function(){try{window.close();}catch(e){}},1000);})();</script>`;
    return withCors(
      req,
      new Response(body, {
        headers: {
          "Content-Type": "text/html",
          "Cross-Origin-Opener-Policy": "unsafe-none",
          "Cross-Origin-Embedder-Policy": "unsafe-none",
        },
      }),
    );
  }

  if (p === "/exchange" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const code = body.otc as string;
    if (!code) {
      return withCors(
        req,
        new Response(JSON.stringify({ error: "missing_code" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    const { data: row } = await supabase
      .from("auth_state_management")
      .select("session, expires_at, used_at, metadata")
      .eq("code", code)
      .single();
    if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
      return withCors(
        req,
        new Response(JSON.stringify({ error: "invalid_code" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    }
    await supabase
      .from("auth_state_management")
      .update({ used_at: new Date().toISOString() })
      .eq("code", code);
    const sess = row.session as any;
    const respBody = {
      access_token: sess.access_token,
      refresh_token: sess.refresh_token,
      expires_at: sess.expires_at,
      provider_token: sess.provider_token,
    };
    return withCors(
      req,
      new Response(JSON.stringify(respBody), {
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  }

  return withCors(req, new Response("Not found", { status: 404 }));
});
