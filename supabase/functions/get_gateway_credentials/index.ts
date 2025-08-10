import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, withCors } from "../_shared/cors.ts";

const origin = "https://smoothr-cms.webflow.io";

serve(async (req) => {
  const url = new URL(req.url);
  const debug = url.searchParams.has("smoothr-debug");
  const log = (...args: any[]) =>
    debug && console.log("[get_gateway_credentials]", ...args);
  const errorLog = (...args: any[]) =>
    debug && console.error("[get_gateway_credentials]", ...args);

  const json = (status: number, error: string) =>
    withCors(
      new Response(JSON.stringify({ error, code: status }), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
      origin,
    );

  try {
    if (req.method === "OPTIONS") {
      return preflight(origin);
    }

    if (req.method !== "POST") {
      errorLog(400, "method must be POST");
      return json(400, "invalid_request");
    }

    const anonKey = Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const headerKey = req.headers.get("apikey");
    if (!anonKey || !headerKey || headerKey !== anonKey) {
      errorLog(401, "apikey missing or mismatch");
      return json(401, "unauthorized");
    }

    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      errorLog("invalid JSON", err);
      return json(400, "invalid_request");
    }

    const { store_id, gateway } = body ?? {};
    const reqGateway: string = gateway;
    const gw = reqGateway === "authorize" ? "authorizeNet" : reqGateway;
    const allowed = ["stripe", "nmi", "authorize"].includes(reqGateway);

    if (typeof store_id !== "string" || !store_id) {
      errorLog(400, "store_id required");
      return json(400, "invalid_request");
    }
    if (!allowed) {
      errorLog(400, "invalid gateway", reqGateway);
      return json(400, "invalid_request");
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      authHeader
        ? { global: { headers: { Authorization: authHeader } } }
        : undefined,
    );

    if (authHeader) {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user) {
        errorLog(401, "invalid token");
        return json(401, "unauthorized");
      }
      const claimStoreId = user.user.user_metadata?.store_id;
      if (claimStoreId && claimStoreId !== store_id) {
        errorLog(400, "store_id claim mismatch");
        return json(400, "invalid_request");
      }
    }

    const { data: settings, error: settingsError } = await supabase
      .from("public_store_settings")
      .select("active_payment_gateway")
      .eq("store_id", store_id)
      .maybeSingle();

    if (settingsError) {
      errorLog("settings query error", settingsError.message);
      return json(403, "forbidden");
    }
    if (!settings) {
      errorLog(404, "store not found", store_id);
      return json(404, "not_found");
    }

    const active = settings.active_payment_gateway === gw;
    if (!active) {
      errorLog(403, "gateway inactive", { store_id, gateway: gw });
      return json(403, "forbidden");
    }

    let publishable_key: string | null = null;
    let tokenization_key: string | null = null;
    let hosted_fields: Record<string, unknown> | null = null;

    if (gw === "stripe" || gw === "nmi") {
      const { data, error } = await supabase
        .from("public_store_integration_credentials")
        .select("publishable_key, tokenization_key")
        .eq("store_id", store_id)
        .eq("gateway", gw)
        .maybeSingle();
      if (error) {
        errorLog("integration query error", error.message);
        return json(403, "forbidden");
      }
      if (!data) {
        errorLog(404, "credential not found", { store_id, gateway: gw });
        return json(404, "not_found");
      }
      publishable_key = data.publishable_key ?? null;
      tokenization_key = data.tokenization_key ?? null;
    } else {
      const { data, error } = await supabase
        .from("store_integrations")
        .select("settings")
        .eq("store_id", store_id)
        .eq("gateway", gw)
        .maybeSingle();
      if (error) {
        errorLog("integration query error", error.message);
        return json(403, "forbidden");
      }
      const settingsObj: any = data?.settings ?? {};
      const clientKey = settingsObj.client_key ?? null;
      const apiLoginId = settingsObj.api_login_id ?? null;
      if (!clientKey && !apiLoginId) {
        errorLog(404, "hosted fields missing", { store_id, gateway: gw });
        return json(404, "not_found");
      }
      hosted_fields = {
        ...(clientKey ? { client_key: clientKey } : {}),
        ...(apiLoginId ? { api_login_id: apiLoginId } : {}),
      };
    }

    const responsePayload = {
      store_id,
      gateway: reqGateway,
      publishable_key: gw === "stripe" ? publishable_key : null,
      tokenization_key: gw === "nmi" ? tokenization_key : null,
      hosted_fields: gw === "authorizeNet" ? hosted_fields : null,
      active,
    };

    log("response", responsePayload);

    return withCors(
      new Response(JSON.stringify(responsePayload), {
        headers: { "Content-Type": "application/json" },
      }),
      origin,
    );
  } catch (err) {
    errorLog("unexpected error", err);
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      new Response(
        JSON.stringify({ error: "server_error", code: 500, message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
      origin,
    );
  }
});

