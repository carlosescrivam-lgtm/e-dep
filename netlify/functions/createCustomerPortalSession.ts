import type { Handler } from "@netlify/functions";
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
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Método no permitido" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { funeralHomeId } = body;

    if (!funeralHomeId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta funeralHomeId" }),
      };
    }

    const { data: funeralHome, error } = await supabase
      .from("funeral_homes")
      .select("id, stripe_customer_id")
      .eq("id", funeralHomeId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!funeralHome) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Funeraria no encontrada" }),
      };
    }

    if (!funeralHome.stripe_customer_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Esta funeraria todavía no tiene stripe_customer_id. Haz una compra de prueba o completa un checkout nuevo.",
        }),
      };
    }

    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      process.env.URL ||
      "http://localhost:8888";

    const session = await stripe.billingPortal.sessions.create({
      customer: funeralHome.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err: any) {
    console.error("createCustomerPortalSession error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "No se pudo crear el portal de cliente",
      }),
    };
  }
};