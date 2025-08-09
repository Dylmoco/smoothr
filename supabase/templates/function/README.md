# Function template

Use this template when creating Supabase Edge Functions.

## Minimal structure

```ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "invalid_request", message: "method must be POST" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const contentType = req.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json")) {
    return new Response(
      JSON.stringify({ error: "invalid_request", message: "content-type must be application/json" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_request", message: "invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // function logic using `body`

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

## POST handling

Functions should only accept `POST` requests. Return `400` for other methods and
`204` for `OPTIONS` preflight requests.

## Body validation

Verify the `Content-Type` is `application/json` and handle JSON parsing errors to
return informative `400` responses.

## CORS helper

Import `getCorsHeaders` from `supabase/functions/_shared/cors.ts` and spread the
returned headers into every response to handle CORS consistently.
