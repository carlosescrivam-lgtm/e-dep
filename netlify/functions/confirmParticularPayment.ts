import { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export const handler: Handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const pageId = body?.page_id;
    const sessionId = body?.session_id;

    if (!pageId || !sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan datos" }),
      };
    }

    // 🔥 CONSULTAMOS STRIPE DIRECTAMENTE
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.payment_status !== "paid" ||
      session.metadata?.kind !== "particular_page" ||
      session.metadata?.page_id !== pageId
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Pago no válido" }),
      };
    }

    // 🔥 ACTIVAMOS LA PÁGINA SI NO LO ESTÁ
    const { data: page } = await supabase
      .from("deceased_pages")
      .select("status, full_name, slug, access_token, family_email")
      .eq("id", pageId)
      .single();

    if (!page) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Página no encontrada" }),
      };
    }

    if (page.status !== "open") {
      await supabase
        .from("deceased_pages")
        .update({ status: "open" })
        .eq("id", pageId);

      console.log("Página activada desde success:", pageId);
    }

    const origin = process.env.URL || "https://e-dep.org";

    const pageUrl = `${origin}/p/${page.slug}?token=${page.access_token}`;

    // 🔥 EMAIL (IDEMPOTENTE SIMPLE)
    if (page.family_email) {
      try {
        await resend.emails.send({
          from: "E-Dep <onboarding@resend.dev>",
          to: page.family_email,
          subject: "Tu página ya está activa",
          html: `<p>Accede aquí: <a href="${pageUrl}">${pageUrl}</a></p>`,
        });
      } catch (e) {
        console.error("Error enviando email (success):", e);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        full_name: page.full_name,
        status: "open",
        url: pageUrl,
      }),
    };
  } catch (err: any) {
    console.error("confirmParticularPayment error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};