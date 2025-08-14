import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createSupabaseClient } from 'shared/supabase/client';

process.env.SUPABASE_URL ||= process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY ||= process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createSupabaseClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

let stripe: Stripe | null = null;

async function readBuffer(readable: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  let stripeSecret = "";
  let webhookSecret = "";
  let storeId: string | null = null;
  try {
    const { data } = await supabase
      .from("store_settings")
      .select("settings, store_id")
      .limit(1)
      .maybeSingle();
    stripeSecret = data?.settings?.stripe_secret_key || "";
    webhookSecret = data?.settings?.stripe_webhook_secret || "";
    storeId = data?.store_id || null;
  } catch {
    // Store settings lookup failed
  }

  if (!stripeSecret || !webhookSecret) {
    try {
      const { data } = await supabase
        .from("integrations")
        .select("provider_key, store_id")
        .eq("provider_key", "stripe")
        .limit(1)
        .maybeSingle();

      if (data?.provider_key && data?.store_id) {
        if (!stripeSecret) {
          const { data: secretData } = await supabase
            .from('vault.decrypted_secrets')
            .select('secret')
            .eq('name', `${data.provider_key}_secret_key_${data.store_id}`)
            .maybeSingle();
          stripeSecret = (secretData as any)?.secret || "";
        }
        if (!webhookSecret) {
          const { data: webhookData } = await supabase
            .from('vault.decrypted_secrets')
            .select('secret')
            .eq('name', `${data.provider_key}_webhook_secret_${data.store_id}`)
            .maybeSingle();
          webhookSecret = (webhookData as any)?.secret || "";
        }
        if (!storeId) {
          storeId = data.store_id;
        }
      }
    } catch {
      // Store integration lookup failed
    }
  }

  if (!stripeSecret) {
    throw new Error("Stripe secret key not configured");
  }
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  stripe = new Stripe(stripeSecret, { apiVersion: "2022-11-15" });

  let event: Stripe.Event;
  try {
    const buf = await readBuffer(req);
    const signature = req.headers["stripe-signature"] || "";
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      webhookSecret,
    );
  } catch (err: unknown) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Unknown verification failure" });
    return;
  }
  // Stripe webhook event received

  if (event.type.startsWith("payment_intent.")) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    let status: string | null = null;
    if (paymentIntent.status === "succeeded") {
      status = "paid";
    } else if (paymentIntent.status === "processing") {
      status = "pending";
    } else if (
      paymentIntent.status === "canceled" ||
      paymentIntent.status === "requires_payment_method"
    ) {
      status = "failed";
    }

    if (status) {
      try {
        const updatePayload: any = { status };
        if (status === "paid") {
          updatePayload.paid_at = new Date().toISOString();
        }
        const { error } = await supabase
          .from("orders")
          .update(updatePayload)
          .eq("payment_intent_id", paymentIntent.id)
          .eq("store_id", storeId);
        if (error) throw error;
      } catch {
        res.status(400).send("Webhook processing error");
        return;
      }
    }
  }

  res.status(200).json({ received: true });
}
