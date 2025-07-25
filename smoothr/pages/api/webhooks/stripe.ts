import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { supabase } from "shared/supabase/serverClient";

const debug = process.env.SMOOTHR_DEBUG === "true";
const log = (...args: any[]) => debug && console.log("[Stripe Webhook]", ...args);
const warn = (...args: any[]) => debug && console.warn("[Stripe Webhook]", ...args);
const err = (...args: any[]) => debug && console.error("[Stripe Webhook]", ...args);

log("🔔 Stripe webhook hit");

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
  log("📩 Request method:", req.method);

  if (req.method !== "POST") {
    err("⛔️ Invalid method");
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
  } catch (e) {
    err("Store settings lookup failed:", e);
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
    } catch (e) {
      err("Store integration lookup failed:", e);
    }
  }

  if (!stripeSecret) {
    throw new Error("Stripe secret key not configured");
  }
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  stripe = new Stripe(stripeSecret, { apiVersion: "2022-11-15" });

  // Add one more log here to catch unexpected crashes early
  log("✅ POST method received. Proceeding to read Stripe payload...");

  let event: Stripe.Event;
  try {
    const buf = await readBuffer(req);
    const signature = req.headers["stripe-signature"] || "";

    log("🧾 Raw buffer length:", buf.length);
    log("📫 Stripe signature header:", signature);

    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      webhookSecret,
    );
    log("✅ Stripe event constructed:", event.type);
  } catch (err: any) {
    err("❌ Stripe webhook verification failed. Full error:", err);
    res
      .status(400)
      .json({ error: err.message || "Unknown verification failure" });
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    log("Stripe webhook event:", event.type);
  }

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
      log('🧮 Supabase update result:', { id, data, error });
      if (process.env.NODE_ENV !== "production") {
        log("Webhook Supabase Update Result:", { id, data, error });
      }
      if (error) throw error;
      if (!data || data.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          warn(`Order not found for payment_intent ${id}`);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        err("Supabase update error:", err);
      }
      res.status(400).send("Webhook processing error");
      return;
    }
  }

  res.status(200).json({ received: true });
}
