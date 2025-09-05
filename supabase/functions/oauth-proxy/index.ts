import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET = Deno.env.get("HMAC_SECRET")!;

const supabase = createClient(supabaseUrl, serviceKey);

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

Deno.serve(async (req) => {
  const ip =
    req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") ||
    "unknown";
  if (!checkRate(ip)) {
    return new Response("Too many requests", { status: 429 });
  }
  const url = new URL(req.url);
  const p = path(url);

  if (p === "/authorize") {
    const storeId = url.searchParams.get("store_id") || "";
    const redirect = url.searchParams.get("redirect_to") || "";
    const provider = url.searchParams.get("provider") || "google";
    if (!storeId || !redirect) {
      return new Response(JSON.stringify({ error: "missing_params" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // fetch store data (not used here but ensures store exists)
    await Promise.all([
      supabase.from("stores").select("id").eq("id", storeId).maybeSingle(),
      supabase.from("store_branding").select("logo_url").eq("store_id", storeId).maybeSingle(),
      supabase.from("store_settings").select("id").eq("store_id", storeId).maybeSingle(),
    ]);

    const state = crypto.randomUUID();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        skipBrowserRedirect: true,
        redirectTo: `https://lpuqrzvokroazwlricgn.supabase.co/functions/v1/oauth-proxy/callback`,
        queryParams: { state },
      },
    });
    if (error || !data?.url) {
      return new Response(JSON.stringify({ error: error?.message || "oauth_error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const codeVerifier: string = (data as any)?.pkce?.code_verifier || "";
    const metadata = { store_id: storeId, redirect_to: redirect, provider };
    const metaJson = JSON.stringify(metadata);
    const sig = await hmac(metaJson);
    await supabase.from("auth_state_management").insert({
      state,
      metadata: metadata,
      hmac: sig,
      code_verifier: codeVerifier,
      type: "state",
      created_at: new Date().toISOString(),
    });
    return new Response(JSON.stringify({ url: data.url }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (p === "/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      return new Response("Invalid callback", { status: 400 });
    }
    const { data: row } = await supabase
      .from("auth_state_management")
      .select("metadata, hmac, code_verifier")
      .eq("state", state)
      .single();
    if (!row || !(await verify(JSON.stringify(row.metadata), row.hmac))) {
      return new Response("Invalid state", { status: 400 });
    }
    const { data: sessData, error } = await supabase.auth.exchangeCodeForSession({
      authCode: code,
      codeVerifier: row.code_verifier,
    });
    if (error || !sessData.session) {
      return new Response("Exchange failed", { status: 400 });
    }
    const otc = crypto.randomUUID();
    await supabase.from("auth_state_management").insert({
      code: otc,
      session: sessData.session,
      type: "exchange", // one-time code
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    const target = (row.metadata as any).redirect_to;
    const body = `<!DOCTYPE html><script>
      (function(){
        const t = ${JSON.stringify(target)};
        const code = ${JSON.stringify(otc)};
        try{ window.opener && window.opener.postMessage({ type: 'smoothr:auth', code }, t); }catch(e){}
        try{ window.close(); }catch(e){}
      })();
    </script>`;
    return new Response(body, { headers: { "Content-Type": "text/html" } });
  }

  if (p === "/exchange" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const code = body.code as string;
    if (!code) {
      return new Response(JSON.stringify({ error: "missing_code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { data: row } = await supabase
      .from("auth_state_management")
      .select("session, expires_at, used_at")
      .eq("code", code)
      .single();
    if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "invalid_code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    await supabase
      .from("auth_state_management")
      .update({ used_at: new Date().toISOString() })
      .eq("code", code);
    return new Response(JSON.stringify(row.session), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not found", { status: 404 });
});

