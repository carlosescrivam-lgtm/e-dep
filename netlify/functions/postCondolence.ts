import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ModerationDecision = {
  status: "approved" | "pending" | "blocked";
  reason: string;
};



async function classifyCondolence(text: string, authorName?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY");
  }

const prompt = `
Eres moderador de un libro de condolencias digital.

Tu tarea es clasificar un mensaje en uno de estos tres estados:
- approved: debe publicarse
- pending: solo si existe una duda razonable y real
- blocked: claramente ofensivo, insultante, acusatorio, burlón, amenazante, sexual, promocional o completamente fuera de lugar

REGLA PRINCIPAL:
Debes ser PERMISIVO con los mensajes afectuosos, cercanos, emotivos, informales o escritos de forma imperfecta.
En caso de duda entre approved y pending, elige approved.
Solo usa pending cuando exista una ambigüedad real que pueda molestar o generar conflicto a la familia.

APRUEBA mensajes como:
- "Descansa en paz"
- "Siempre te recordaremos"
- "Qué bien lo hemos pasado contigo"
- "Cuánto te vamos a echar de menos"
- "Fiestas como las que tú organizabas no se repetirán"
- "Un abrazo enorme a la familia"
- "Te recordaré siempre amigo"
- recuerdos cercanos, anécdotas cariñosas o frases emocionales aunque sean informales

ENVÍA A PENDING solo si:
- el mensaje puede interpretarse como reproche
- hay ironía o ambigüedad
- el tono no está claro
- puede haber doble sentido conflictivo
- parece una crítica encubierta

BLOQUEA solo si:
- hay insultos
- hay acusaciones ("era un ladrón", "era un estafador")
- hay burlas o desprecio
- hay amenazas
- hay contenido sexual
- hay spam o promoción
- hay mensajes claramente irrespetuosos

Piensa como si este mensaje fuera a leerlo una familia en duelo.
No seas estricto con mensajes cariñosos o de recuerdo.

Devuelve SOLO JSON con este esquema:
{
  "status": "approved" | "pending" | "blocked",
  "reason": "motivo_corto"
}

Autor: ${authorName || "Anónimo"}
Mensaje: ${text}
`.trim();

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "condolence_moderation",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              status: {
                type: "string",
                enum: ["approved", "pending", "blocked"],
              },
              reason: {
                type: "string",
              },
            },
            required: ["status", "reason"],
          },
        },
      },
    }),
  });

  const rawText = await res.text();

console.log("OpenAI classify status:", res.status);
console.log("OpenAI classify body:", rawText);

let data: any = {};
try {
  data = JSON.parse(rawText);
} catch {
  throw new Error(`Respuesta no JSON de OpenAI: ${rawText}`);
}


  if (!res.ok) {
    throw new Error(data?.error?.message || "Error en clasificación IA");
  }

  const raw =
  data?.output_text ||
  data?.output?.find((item: any) => item.type === "message")?.content?.[0]?.text ||
  "{}";

  const parsed = JSON.parse(raw) as ModerationDecision;

  if (
    parsed.status !== "approved" &&
    parsed.status !== "pending" &&
    parsed.status !== "blocked"
  ) {
    throw new Error("Respuesta de moderación inválida");
  }

  return parsed;
}

async function moderateCondolence(message: string, authorName?: string) {
  try {
    return await classifyCondolence(message, authorName);
  } catch (err: any) {
    console.error("Moderation fallback to pending:", err?.message || err);

    return {
      status: "pending",
      reason: "moderation_unavailable",
    } as ModerationDecision;
  }
}


export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = event.body ? JSON.parse(event.body) : null;
const slug = body?.slug;
const token = body?.token;
const author_name = body?.author_name ?? null;
const message = body?.message;
const photo_path = body?.photo_path ?? null;

    if (!slug || !token || !message || !String(message).trim()) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Faltan datos obligatorios." }),
  };
}

    const { data: page, error: pageError } = await supabase
  .from("deceased_pages")
  .select("id, status, closes_at")
  .eq("slug", slug)
  .eq("access_token", token)
  .maybeSingle();

    if (pageError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pageError.message }),
      };
    }

    if (!page) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Página no encontrada." }),
      };
    }

    if (page.status === "closed") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "La página está cerrada." }),
      };
    }

    if (page.closes_at && new Date(page.closes_at).getTime() < Date.now()) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "La página ya no acepta mensajes." }),
      };
    }

    const trimmedAuthor = String(author_name || "").trim() || "Anónimo";
    const trimmedMessage = String(message).trim();

   let decision:
  | { status: "approved" | "pending" | "blocked"; reason: string }
  | null = null;

let dbModerationStatus: "approved" | "pending" | "rejected";

if (photo_path) {
  dbModerationStatus = "pending";
} else {
  decision = await moderateCondolence(trimmedMessage, trimmedAuthor);
  dbModerationStatus =
    decision.status === "blocked" ? "rejected" : decision.status;
}

   const { error: insError } = await supabase.from("condolences").insert({
  page_id: page.id,
  author_name: trimmedAuthor,
  message: trimmedMessage,
  photo_path: photo_path || null,
  moderation_status: dbModerationStatus,
  moderation_reason: decision?.reason || null,
});

if (!photo_path && decision?.status === "blocked") {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      moderation_status: "rejected",
      message:
        "Tu mensaje no ha podido publicarse porque no cumple las normas de respeto de este espacio.",
    }),
  };
}

    if (insError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: insError.message }),
      };
    }

if (dbModerationStatus === "pending") {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      moderation_status: "pending",
      message: photo_path
        ? "Todos los mensajes con foto quedan temporalmente pendientes de revisión por parte del equipo de E-Dep."
        : "Tu mensaje ha quedado pendiente de revisión antes de publicarse.",
    }),
  };
}

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        moderation_status: "approved",
      }),
    };
  } catch (err: any) {
    console.error("postCondolence error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "No se pudo publicar el mensaje.",
      }),
    };
  }
};