import { createClient } from "npm:@supabase/supabase-js@2.39.3";

export interface CorsOptions {
  allowedOrigins?: string[];
  validateAgainstStores?: boolean;
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
  defaultOrigin?: string; // only used if validate fails and you explicitly want a fallback
}

const defaults: Required<CorsOptions> = {
  allowedOrigins: [],
  validateAgainstStores: true,
  allowedMethods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Client-Info"],
  maxAge: 86400,
  defaultOrigin: "",
};

function hostnameOf(origin: string): string | null {
  try { return new URL(origin).hostname; } catch { return null; }
}

function wildcardMatch(host: string, pattern: string): boolean {
  if (!pattern.startsWith("*".concat("."))) return host === pattern;
  const base = pattern.slice(2); // drop "*."
  // host must end with ".base" and contain at least one additional dot
  return host.endsWith("." + base) || host === base;
}

async function originAllowedByStore(
  origin: string,
  storeId?: string
): Promise<boolean> {
  const host = hostnameOf(origin);
  if (!host) return false;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Adjust this select to match your schema:
  // We’ll accept any of: live_domain, store_domain, and optional array column "domains"
  let q = supabase.from("stores").select("id, live_domain, store_domain, domains");
  if (storeId) q = q.eq("id", storeId);
  const { data: rows, error } = await q;
  if (error || !rows?.length) return false;

  for (const row of rows) {
    const candidates: string[] = [];
    if (row.live_domain) candidates.push(row.live_domain);
    if (row.store_domain) candidates.push(row.store_domain);
    if (Array.isArray(row.domains)) candidates.push(...row.domains);
    // Normalize: we expect raw hostnames like "coolshop.com" or "*.webflow.io"
    for (const pat of candidates) {
      if (!pat) continue;
      if (wildcardMatch(host, pat)) return true;
      // Also allow exact match when origin already includes full host
      if (host === pat) return true;
    }
  }
  return false;
}

export async function applyCors(
  req: Request,
  opts?: CorsOptions,
  storeId?: string
): Promise<Response | null> {
  const o = { ...defaults, ...opts };
  const origin = req.headers.get("origin");
  if (!origin) return null; // not a CORS request

  let allowed = false;
  if (o.allowedOrigins.length) {
    allowed = o.allowedOrigins.includes(origin);
  }
  if (!allowed && o.validateAgainstStores) {
    allowed = await originAllowedByStore(origin, storeId);
  }

  const useOrigin = allowed ? origin : (o.defaultOrigin || "");
  if (req.method === "OPTIONS") {
    // Always reply to preflight if we have a useOrigin
    if (!useOrigin) return new Response(null, { status: 204 });
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": useOrigin,
        "Access-Control-Allow-Methods": o.allowedMethods.join(", "),
        "Access-Control-Allow-Headers": o.allowedHeaders.join(", "),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": String(o.maxAge),
        "Vary": "Origin",
      },
    });
  }
  // Stash allowed origin on the request via a header we’ll read later
  if (useOrigin) {
    req.headers.set("x-allowed-origin", useOrigin);
  }
  return null;
}

export function withCors(req: Request, res: Response): Response;
export function withCors(res: Response, origin?: string): Response;
export function withCors(a: Request | Response, b?: Response | string): Response {
  if (a instanceof Request && b instanceof Response) {
    const allowed = a.headers.get("x-allowed-origin");
    if (!allowed) return b;
    const h = new Headers(b.headers);
    h.set("Access-Control-Allow-Origin", allowed);
    h.set("Access-Control-Allow-Credentials", "true");
    h.set("Vary", "Origin");
    return new Response(b.body, { status: b.status, statusText: b.statusText, headers: h });
  }
  const res = a as Response;
  const origin = (b as string) || "*";
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", origin);
  h.set("Access-Control-Allow-Methods", defaults.allowedMethods.join(", "));
  h.set("Access-Control-Allow-Headers", defaults.allowedHeaders.join(", "));
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Max-Age", String(defaults.maxAge));
  h.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers: h });
}

export function preflight(origin: string = "*"): Response {
  return withCors(new Response(null, { status: 204 }), origin);
}

