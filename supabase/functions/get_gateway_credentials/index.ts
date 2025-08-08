import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { gateway } = Object.fromEntries(new URL(req.url).searchParams);

  if (!gateway) {
    return new Response(JSON.stringify({ error: "Missing gateway" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")!,
        },
      },
    }
  );

  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const store_id = user.user.user_metadata?.store_id;
  if (!store_id) {
    return new Response(JSON.stringify({ error: "Missing store_id in JWT" }), { status: 400 });
  }

  const { data, error } = await supabase
    .from("public_store_integration_credentials")
    .select("publishable_key, tokenization_key")
    .eq("store_id", store_id)
    .eq("gateway", gateway)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Credential not found or unauthorized" }), { status: 403 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
