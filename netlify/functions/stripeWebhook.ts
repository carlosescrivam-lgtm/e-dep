import { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  try {
    const signature =
      event.headers["stripe-signature"] ||
      event.headers["Stripe-Signature"];

    if (!signature) {
      return {
        statusCode: 400,
        body: "Missing Stripe-Signature header",
      };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const rawBody = event.body || "";

    const stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

   if (stripeEvent.type === "checkout.session.completed") {
  const session = stripeEvent.data.object as any;
  const stripeCustomerId =
  typeof session.customer === "string" ? session.customer : null;

  console.log("checkout.session.completed recibido");
  console.log("SESSION METADATA:", session.metadata);
  console.log("SESSION SUBSCRIPTION:", session.subscription);

  const funeralHomeId = session.metadata?.funeral_home_id || null;
  const fallbackPlan = session.metadata?.subscription_plan || null;

  if (!funeralHomeId) {
    console.log("Falta funeral_home_id en metadata");
  } else {
    let subscriptionStart: string | null = null;
let subscriptionUntil: string | null = null;
let finalPlan = fallbackPlan;
let finalStatus = "active";

    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id
      );

     console.log("Stripe subscription recuperada:", {
  id: subscription.id,
  status: subscription.status,
  item_period_end: subscription.items?.data?.[0]?.current_period_end,
  metadata: subscription.metadata,
});

finalStatus =
  subscription.status === "active" || subscription.status === "trialing"
    ? "active"
    : "cancelled";

finalPlan =
  subscription.metadata?.subscription_plan ||
  fallbackPlan ||
  null;

const periodStart =
  subscription.items?.data?.[0]?.current_period_start ?? null;

const periodEnd =
  subscription.items?.data?.[0]?.current_period_end ?? null;

const subscriptionStart = periodStart
  ? new Date(periodStart * 1000).toISOString()
  : null;

subscriptionUntil = periodEnd
  ? new Date(periodEnd * 1000).toISOString()
  : null;
    }

    const { error } = await supabase
      .from("funeral_homes")
      .update({
  subscription_status: finalStatus,
  subscription_plan: finalPlan,
  subscription_start: subscriptionStart,
  subscription_until: subscriptionUntil,
  stripe_customer_id: stripeCustomerId,
})
      .eq("id", funeralHomeId);

    if (error) {
      console.error("Error actualizando funeral_homes:", error);
    } else {
      console.log("Funeraria actualizada correctamente:", {
  funeralHomeId,
  finalPlan,
  finalStatus,
  subscriptionStart,
  subscriptionUntil,
  stripeCustomerId,
});
    }
  }
}

    if (stripeEvent.type === "customer.subscription.deleted") {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const funeralHomeId = subscription.metadata?.funeral_home_id || null;

      if (funeralHomeId) {
        await supabase
          .from("funeral_homes")
          .update({
            subscription_status: "cancelled",
          })
          .eq("id", funeralHomeId);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err: any) {
    console.error("stripeWebhook error:", err);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err?.message || "Unknown error"}`,
    };
  }
};