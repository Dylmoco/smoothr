import { createSupabaseClient } from "./_shared/supabase-client.ts";
import Handlebars from "npm:handlebars@4.7.7";

interface EmailPayload {
  store_id: string;
  type: string;
  email: string;
  data: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const requestPayload: EmailPayload = await req.json();
    const { type, email, data, store_id } = requestPayload;

    if (!type || !email || !data || !store_id) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseClient();

    const [customerRes, brandingRes, templateRes] = await Promise.all([
      supabase
        .from("customers")
        .select("id, first_name, last_name")
        .eq("store_id", store_id)
        .eq("email", email)
        .maybeSingle(),
      supabase
        .from("store_branding")
        .select("name, logo_url, primary_color")
        .eq("store_id", store_id)
        .maybeSingle(),
      supabase
        .from("notification_templates")
        .select("subject, content")
        .eq("store_id", store_id)
        .eq("type", type)
        .maybeSingle(),
    ]);

    const customer = customerRes.data;
    const branding = brandingRes.data;
    const template = templateRes.data;

    if (!customer || !branding || !template) {
      return new Response(
        JSON.stringify({ success: false, message: "Template not found" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const templateData = {
      ConfirmationURL: (data as any)?.ConfirmationURL,
      Token: (data as any)?.Token,
      TokenHash: (data as any)?.TokenHash,
      SiteURL: (data as any)?.SiteURL,
      RedirectTo: (data as any)?.RedirectTo,
      Email: email,
      NewEmail: (data as any)?.NewEmail,
      StoreName: branding.name,
      FirstName: customer.first_name,
      LastName: customer.last_name,
      FullName: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`
        .trim(),
      LogoUrl: branding.logo_url,
      PrimaryColor: branding.primary_color,
    };

    const subject = Handlebars.compile(template.subject)(templateData);
    const content = Handlebars.compile(template.content)(templateData);

    const wrappedHtml = /<html/i.test(content)
      ? content
      : `<html><body><div style="font-family:sans-serif;max-width:600px;margin:auto;">
${
        branding.logo_url
          ? `<img src="${branding.logo_url}" alt="${branding.name}" style="max-width:150px;" />`
          : ""
      }
${content}
</div></body></html>`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${branding.name} via Smoothr <noreply@stores.smoothr.io>`,
        to: email,
        subject,
        html: wrappedHtml,
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const logRes = await supabase.from("notifications").insert({
      store_id,
      customer_id: customer.id,
      type,
      payload: requestPayload,
      status: "sent",
    });
    if (logRes.error) {
      console.error("Failed to log notification:", logRes.error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
