import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  try {
    const pageId = event.queryStringParameters?.page_id;

    if (!pageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta page_id" }),
      };
    }

    const { data: messages, error } = await supabase
      .from("condolences")
     .select(
  "id, page_id, author_name, message, photo_path, created_at, deleted_at, moderation_status, moderation_reason"
)
      .eq("page_id", pageId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

const published = (messages || []).filter(
  (msg) => !msg.deleted_at && msg.moderation_status === "approved"
);

const pending = (messages || []).filter(
  (msg) => !msg.deleted_at && msg.moderation_status === "pending"
);

const rejected = (messages || []).filter(
  (msg) => !!msg.deleted_at || msg.moderation_status === "rejected"
);

return {
  statusCode: 200,
  body: JSON.stringify({
    published,
    pending,
    rejected,
  }),
};
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "Error cargando mensajes de soporte",
      }),
    };
  }
};