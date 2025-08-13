import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { supabase } from 'shared/supabase/serverClient';

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
  try {
    const { data } = await supabase
      .from("store_settings")
      .select("settings")
      .limit(1)
      .maybeSingle();
    stripeSecret = data?.settings?.stripe_secret_key || "";
    webhookSecret = data?.settings?.stripe_webhook_secret || "";
  } catch {
    // Store settings lookup failed
  }

  if (!stripeSecret || !webhookSecret) {
    try {
      const { data } = await supabase
        .from("store_integrations")
        .select("api_key, settings")
        .eq("gateway", "stripe")
        .limit(1)
        .maybeSingle();
      if (!stripeSecret) {
        stripeSecret = data?.settings?.secret_key || data?.api_key || "";
      }
      if (!webhookSecret) {
        webhookSecret = data?.settings?.webhook_secret || "";
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

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const id = paymentIntent.id;
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("payment_intent_id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        // Order not found for payment_intent
      }
    } catch (error: unknown) {
      res.status(400).send("Webhook processing error");
      return;
    }
  }

  res.status(200).json({ received: true });
}
