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

    const origin = process.env.URL || "https://www.e-dep.org";

    const pageUrl = `${origin}/p/${page.slug}?token=${page.access_token}`;



let mailSent = false;
let mailError: string | null = null;

// 🔥 EMAIL (IDEMPOTENTE SIMPLE)
if (page.family_email) {
  try {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
  pageUrl
)}`;

const { data, error } = await resend.emails.send({
  from: "E-Dep <no-reply@e-dep.org>",
  to: page.family_email,
  subject: `Tu página de condolencias ya está activa`,
  html: `
    <div style="font-family: Arial, sans-serif; color:#0f172a; line-height:1.6;">
      <h2 style="margin-bottom: 8px;">Tu página ya está activa</h2>

      <p>
        Gracias por tu compra. Ya puedes acceder y compartir tu página de condolencias.
      </p>

      <p style="margin-top: 16px;">
        <a
          href="${pageUrl}"
          style="display:inline-block; padding:12px 18px; background:#0f172a; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700;"
        >
          Ver mi página
        </a>
      </p>

      <p style="margin-top: 20px;">
        <strong>Enlace directo:</strong><br/>
        ${pageUrl}
      </p>

      <p style="margin-top: 20px;"><strong>Código QR:</strong></p>
      <p>
        <img src="${qrUrl}" alt="QR página condolencias" width="220" height="220" />
      </p>

      <hr style="margin: 28px 0; border:none; border-top:1px solid #e2e8f0;" />

      <h3 style="margin-bottom: 8px;">Comprobante de compra</h3>
      <p>Servicio: Página de condolencias E-Dep</p>
      <p>Importe: 12,00 €</p>
      <p>Estado: Pagado</p>

      <p style="margin-top: 20px;">
        Al finalizar el periodo, recibirás también el PDF final con los mensajes recopilados.
      </p>
    </div>
  `,
});

    if (error) {
      console.error("Resend error (success):", error);
      mailError =
        typeof error === "string" ? error : JSON.stringify(error);
    } else {
      console.log("Email enviado OK (success):", data);
      mailSent = true;
    }
  } catch (e: any) {
    console.error("Error enviando email (success):", e);
    mailError = e?.message || "Error desconocido enviando email";
  }
}

   return {
  statusCode: 200,
  body: JSON.stringify({
    full_name: page.full_name,
    status: "open",
    url: pageUrl,
    mail_sent: mailSent,
    mail_error: mailError,
    family_email: page.family_email || null,
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