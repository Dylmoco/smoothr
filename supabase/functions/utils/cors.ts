export function allowCors(req: Request, resp: Response): Response {
  const origin = req.headers.get("origin");
  if (!origin) return resp;

  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Client-Info",
  );
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");

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

export function handleCorsPreflightRequest(req: Request) {
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
