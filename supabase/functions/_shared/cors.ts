export function withCors(res: Response, origin: string = "*"): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, apikey, content-type, user-agent",
  );
  headers.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers });
}
export function preflight(origin: string = "*"): Response {
  return withCors(new Response(null, { status: 204 }), origin);
}

export function assertOrigin(
  origin: string,
  allowlist: string[] = [],
  wildcard = false,
): Response | undefined {
  if (allowlist.length > 0 && !allowlist.includes(origin) && !wildcard) {
    return new Response("origin not allowed", { status: 403 });
  }
  return undefined;
}

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function hostFromOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    const raw = origin.replace(/^https?:\/\//i, "").toLowerCase();
    return raw.split("/")[0] || null;
  }
}

export async function getAllowedHostsForStore(
  storeId: string,
  client: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await client
    .from("stores")
    .select("store_domain, live_domain, public_store_settings!inner(api_base)")
    .eq("id", storeId)
    .single();
  if (error) return new Set();
  const allowed = new Set<string>();
  const push = (v?: string | null) => {
    if (v) {
      const host = v.replace(/^https?:\/\//i, "").toLowerCase().split("/")[0];
      if (host) allowed.add(host);
    }
  };
  push(data?.store_domain);
  push(data?.live_domain);
  push(data?.public_store_settings?.api_base);
  return allowed;
}

export function isAllowedOrigin(
  requestOriginHost: string | null,
  allowedHosts: Set<string>,
): boolean {
  if (!requestOriginHost) return false;
  return allowedHosts.has(requestOriginHost);
}
