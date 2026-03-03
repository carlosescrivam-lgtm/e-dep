import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Importante: esto llamará a tu función interna generatePdf via HTTP (para no duplicar lógica)
const SITE_URL = process.env.SITE_URL || process.env.URL || ""; // en Netlify normalmente existe

export default async (_req: Request) => {
  try {
    // 1) Buscar páginas abiertas ya expiradas
    const nowIso = new Date().toISOString();

    const { data: pages, error } = await supabase
      .from("deceased_pages")
      .select("id")
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
        // Si no tenemos SITE_URL en local, lo saltamos
        if (!SITE_URL) {
          console.log("SITE_URL vacío: saltando en local");
          continue;
        }

        const res = await fetch(`${SITE_URL}/.netlify/functions/generatePdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: p.id }),
        });

        if (!res.ok) {
          const t = await res.text();
          console.error("generatePdf failed:", p.id, t);
        } else {
          console.log("generatePdf OK:", p.id);
        }
      } catch (e) {
        console.error("generatePdf exception:", p.id, e);
      }
    }
  } catch (e) {
    console.error("closeExpiredPages ERROR:", e);
  }
};

export const config: Config = {
  schedule: "@hourly",
};