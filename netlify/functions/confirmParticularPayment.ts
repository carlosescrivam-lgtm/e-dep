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
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:20px;">
    
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; padding:24px; border:1px solid #e2e8f0;">
      
      <h2 style="margin:0 0 10px 0; font-size:22px; color:#0f172a;">
        Tu página ya está activa
      </h2>

      <p style="margin:0 0 16px 0; color:#475569;">
        Gracias por confiar en E-Dep. Ya puedes acceder y compartir tu página de condolencias.
      </p>

      <div style="text-align:center; margin:20px 0;">
        <a href="${pageUrl}"
          style="display:inline-block; padding:14px 22px; background:#0f172a; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700;">
          Ver mi página
        </a>
      </div>

      <div style="margin-top:20px;">
        <p style="margin:0 0 6px 0; font-size:14px; color:#64748b;">
          Enlace directo
        </p>
        <p style="word-break:break-all; font-size:14px; color:#0f172a;">
          ${pageUrl}
        </p>
      </div>

      <div style="margin-top:26px; text-align:center;">
        <p style="margin-bottom:10px; font-weight:600;">
          Código QR
        </p>
        <img src="${qrUrl}" width="220" height="220" style="border-radius:12px; border:1px solid #e2e8f0; padding:10px; background:#ffffff;" />
        <p style="font-size:13px; color:#64748b; margin-top:8px;">
          Puedes guardar esta imagen o compartirla directamente
        </p>
      </div>

      <hr style="margin:28px 0; border:none; border-top:1px solid #e2e8f0;" />

      <div>
        <h3 style="margin-bottom:10px;">Comprobante de compra</h3>
        <p style="margin:4px 0;">Servicio: Página de condolencias E-Dep</p>
        <p style="margin:4px 0;">Importe: 12,00 €</p>
        <p style="margin:4px 0;">Estado: Pagado</p>
        <p style="margin:4px 0;">Fecha: ${new Date().toLocaleString("es-ES")}</p>
      </div>

      <div style="margin-top:20px; font-size:14px; color:#475569;">
        <p>
          Al finalizar el periodo contratado, recibirás automáticamente un PDF con todos los mensajes recopilados.
        </p>
      </div>

      <div style="margin-top:24px; font-size:12px; color:#94a3b8; text-align:center;">
        © E-Dep · Servicio de condolencias digitales
      </div>

    </div>
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