import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
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
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const pageId = String(body?.page_id || "").trim();

    if (!pageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta page_id." }),
      };
    }

    const { data: page, error: pageError } = await supabase
      .from("deceased_pages")
      .select("id, full_name, family_email, status")
      .eq("id", pageId)
      .single();

    if (pageError || !page) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Página no encontrada." }),
      };
    }

    if (page.status !== "pending_payment") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Esta página no está pendiente de pago." }),
      };
    }

    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      process.env.URL ||
      "http://localhost:8888";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: page.family_email || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Página de condolencias para ${page.full_name}`,
              description: "Enlace y QR de página de condolencias E-Dep",
            },
            unit_amount: 1200,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/particular/success?page_id=${page.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/particular?cancelled=1`,
      metadata: {
        kind: "particular_page",
        page_id: page.id,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        url: session.url,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "No se pudo iniciar el pago.",
      }),
    };
  }
};