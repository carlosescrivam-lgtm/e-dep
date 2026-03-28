import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);
const resend = new Resend(process.env.RESEND_API_KEY!);
// Importante: esto llamará a tu función interna generatePdf via HTTP (para no duplicar lógica)
const SITE_URL = process.env.SITE_URL || process.env.URL || ""; // en Netlify normalmente existe

export default async (_req: Request) => {
  try {
    // 1) Buscar páginas abiertas ya expiradas
    const nowIso = new Date().toISOString();

    const { data: pages, error } = await supabase
  .from("deceased_pages")
  .select("id, full_name, family_email, slug, access_token, closes_at")
  .eq("status", "open")
  .lt("closes_at", nowIso)
  .limit(50);

    if (error) {
      console.error("closeExpiredPages select error:", error);
      return;
    }

    if (!pages || pages.length === 0) {
      console.log("closeExpiredPages: nada que cerrar");
      return;
    }

    console.log(`closeExpiredPages: ${pages.length} páginas a cerrar`);

    // 2) Para cada página: generar PDF y cerrar (reutiliza tu generatePdf)
    // NOTA: Scheduled functions no aceptan payloads, pero aquí sí podemos hacer fetch interno.

for (const p of pages) {
  try {
    if (!SITE_URL) {
      console.log("SITE_URL vacío: saltando en local");
      continue;
    }

    // 1) Cerrar la página
    const { error: closeError } = await supabase
      .from("deceased_pages")
      .update({ status: "closed" })
      .eq("id", p.id)
      .eq("status", "open");

    if (closeError) {
      console.error("Error cerrando página:", p.id, closeError);
      continue;
    }

    // 2) Generar PDF
    const res = await fetch(`${SITE_URL}/.netlify/functions/generatePdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: p.id }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("generatePdf failed:", p.id, t);
      continue;
    }

    console.log("generatePdf OK:", p.id);

    // 3) Obtener enlace del PDF
    const linkRes = await fetch(
      `${SITE_URL}/.netlify/functions/getPdfLink?pageId=${encodeURIComponent(p.id)}`
    );

    if (!linkRes.ok) {
      console.error("getPdfLink failed:", p.id);
      continue;
    }

    const linkData = await linkRes.json().catch(() => ({}));
    const pdfUrl =
      linkData?.pdfUrl ||
      linkData?.url ||
      linkData?.link ||
      linkData?.signedUrl ||
      "";

    if (!pdfUrl) {
      console.error("No se encontró PDF:", p.id);
      continue;
    }

    // 4) Enviar email final
    if (p.family_email) {
      try {
       await resend.emails.send({
  from: "E-Dep <no-reply@e-dep.org>",
  to: p.family_email,
  subject: `PDF final disponible · ${p.full_name}`,
  html: `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:20px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; padding:24px; border:1px solid #e2e8f0;">

        <h2 style="margin:0 0 10px 0; font-size:22px; color:#0f172a;">
          La página de condolencias ha finalizado
        </h2>

        <p style="margin:0 0 16px 0; color:#475569; line-height:1.6;">
          La página de condolencias de <strong>${p.full_name}</strong> ya se ha cerrado y no admite nuevos mensajes.
        </p>

        <p style="margin:0 0 16px 0; color:#475569; line-height:1.6;">
          Hemos preparado el <strong>PDF final</strong> con todos los mensajes recopilados para que puedas guardarlo, compartirlo o imprimirlo si lo deseas.
        </p>

        <div style="text-align:center; margin:20px 0;">
          <a
            href="${pdfUrl}"
            style="display:inline-block; padding:14px 22px; background:#0f172a; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700;"
          >
            Ver PDF final
          </a>
        </div>

        <div style="margin-top:20px;">
          <p style="margin:0 0 6px 0; font-size:14px; color:#64748b;">
            Enlace directo al PDF
          </p>
          <p style="word-break:break-all; font-size:14px; color:#0f172a; margin:0;">
            ${pdfUrl}
          </p>
        </div>

        <hr style="margin:28px 0; border:none; border-top:1px solid #e2e8f0;" />

        <div>
          <h3 style="margin:0 0 10px 0; font-size:18px; color:#0f172a;">
            Recuerdo final
          </h3>

          <p style="margin:4px 0; color:#475569; line-height:1.6;">
            Este documento reúne los mensajes recibidos durante el tiempo en que la página estuvo activa.
          </p>

          <p style="margin:12px 0 0 0; color:#475569; line-height:1.6;">
            Gracias por haber confiado en E-Dep para conservar este recuerdo.
          </p>
        </div>

        <div style="margin-top:24px; font-size:12px; color:#94a3b8; text-align:center;">
          © E-Dep · Servicio de condolencias digitales
        </div>
      </div>
    </div>
  `,
});

        console.log("Email enviado:", p.id);
      } catch (err) {
        console.error("Error enviando email:", err);
      }
    }
  } catch (e) {
    console.error("closeExpiredPages exception:", p.id, e);
  }
}

  } catch (e) {
    console.error("closeExpiredPages ERROR:", e);
  }
};

export const config: Config = {
  schedule: "@hourly",
};