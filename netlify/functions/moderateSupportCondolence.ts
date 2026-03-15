import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

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
    const messageId = body?.messageId;
    const action = body?.action;

    if (!messageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta messageId" }),
      };
    }

    if (!action || !["approve", "delete"].includes(action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Acción no válida" }),
      };
    }

    if (action === "approve") {
      const { error } = await supabase
        .from("condolences")
      .update({
  moderation_status: "approved",
  moderation_reason: null,
  deleted_at: null,
})
        .eq("id", messageId);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("condolences")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "Error moderando condolencia",
      }),
    };
  }
};