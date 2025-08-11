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
