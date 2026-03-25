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

  const metadata = session.metadata || {};

  // 1) CASO PARTICULARES
if (metadata.kind === "particular_page" && metadata.page_id) {
  const pageId = metadata.page_id;

  const { data: updatedPage, error: updateError } = await supabase
    .from("deceased_pages")
    .update({
      status: "open",
    })
    .eq("id", pageId)
    .select("full_name, slug, access_token, family_email, closes_at")
    .single();

  if (updateError || !updatedPage) {
    console.error("Error activando página particular:", updateError);
  } else {
    console.log("Página particular activada:", pageId);

    const origin =
      process.env.URL || "https://e-dep.org";

    const pageUrl = `${origin}/p/${updatedPage.slug}?token=${updatedPage.access_token}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      pageUrl
    )}`;

    // ✉️ ENVÍO DE EMAIL
    if (updatedPage.family_email) {
      try {
        await resend.emails.send({
          from: "E-Dep <onboarding@resend.dev>",
          to: updatedPage.family_email,
          subject: `Tu página de condolencias ya está lista`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
              
              <h2 style="margin-bottom: 8px;">Tu página ya está activa</h2>
              
              <p>Gracias por tu compra. Ya puedes acceder y compartir tu página:</p>

              <p><strong>${updatedPage.full_name}</strong></p>

              <p style="margin-top: 16px;">
                <a href="${pageUrl}" style="display:inline-block; padding:12px 18px; background:#0f172a; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700;">
                  Ver mi página
                </a>
              </p>

              <p style="margin-top: 20px;"><strong>Enlace directo:</strong><br/>${pageUrl}</p>

              <p style="margin-top: 20px;"><strong>Código QR:</strong></p>
              <p><img src="${qrUrl}" width="220" /></p>

              <hr style="margin: 28px 0; border:none; border-top:1px solid #e2e8f0;" />

              <h3>Comprobante de compra</h3>

              <p>Servicio: Página de condolencias E-Dep</p>
              <p>Importe: 12,00 €</p>
              <p>Fecha: ${new Date().toLocaleString("es-ES")}</p>
              <p>Estado: Pagado</p>

              <p style="margin-top: 20px;">
                Al finalizar el periodo, recibirás un PDF con todos los mensajes recopilados.
              </p>

            </div>
          `,
        });
      } catch (mailError) {
        console.error("Error enviando email:", mailError);
      }
    }
  }
}

  // 2) CASO FUNERARIAS (flujo actual)
  const funeralHomeId = metadata.funeral_home_id || null;
  const fallbackPlan = metadata.subscription_plan || null;

  if (metadata.kind === "particular_page") {
  // Ya procesado arriba. No hacemos nada más.
} else if (!funeralHomeId) {
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