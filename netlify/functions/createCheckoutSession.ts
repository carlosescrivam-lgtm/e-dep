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

const priceMap: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
  unlimited: process.env.STRIPE_PRICE_UNLIMITED,
};

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { plan, funeralHomeId } = body;

    if (!plan || !funeralHomeId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan datos obligatorios." }),
      };
    }

  const priceMap: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
  unlimited: process.env.STRIPE_PRICE_UNLIMITED,
};

const priceId = priceMap[plan];

    const { data: funeralHome, error: homeError } = await supabase
      .from("funeral_homes")
      .select("id, name, contact_email")
      .eq("id", funeralHomeId)
      .maybeSingle();

    if (homeError) throw homeError;

    if (!funeralHome) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Funeraria no encontrada." }),
      };
    }

    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      process.env.URL ||
      "http://localhost:8888";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: funeralHome.contact_email || undefined,
      metadata: {
        funeral_home_id: funeralHome.id,
        subscription_plan: plan,
      },
      subscription_data: {
        metadata: {
          funeral_home_id: funeralHome.id,
          subscription_plan: plan,
        },
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err: any) {
    console.error("createCheckoutSession error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "No se pudo iniciar el pago.",
      }),
    };
  }
};