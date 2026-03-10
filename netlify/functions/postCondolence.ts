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

Debes clasificar el mensaje en uno de estos tres estados:
- approved: apropiado para publicarse
- pending: dudoso, ambiguo, conflictivo o requiere revisión humana
- blocked: claramente ofensivo, hiriente, insultante, acusatorio, burlón, amenazante, sexual, spam o completamente fuera de lugar

Criterios:
- PERMITE recuerdos afectuosos, cercanos, informales o íntimos.
- PERMITE anécdotas emotivas y frases como "Qué bien lo hemos pasado", "Siempre te recordaremos", "Fiestas como las que tú organizabas no se repetirán".
- PERMITE mensajes sencillos o personales, siempre que sean respetuosos.
- BLOQUEA insultos, acusaciones, burlas, humillaciones, desprecio, amenazas, comentarios vejatorios o mensajes promocionales.
- ENVÍA A PENDING si el contenido puede generar conflicto, interpretarse como reproche o no es claramente apropiado.
- Piensa como si esto fuera una página de condolencias para una familia.

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

    const decision = await moderateCondolence(trimmedMessage, trimmedAuthor);

    if (decision.status === "blocked") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error:
            "No se ha podido publicar el mensaje porque no cumple las normas de respeto de este espacio.",
          moderation_status: "blocked",
        }),
      };
    }

    const { error: insError } = await supabase.from("condolences").insert({
      page_id: page.id,
      author_name: trimmedAuthor,
      message: trimmedMessage,
      photo_path: photo_path || null,
      moderation_status: decision.status,
      moderation_reason: decision.reason || null,
    });

    if (insError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: insError.message }),
      };
    }

    if (decision.status === "pending") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          moderation_status: "pending",
          message:
            "Tu mensaje ha quedado pendiente de revisión antes de publicarse.",
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